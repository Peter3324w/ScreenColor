'use strict';
const {app,BrowserWindow,ipcMain,Tray,Menu,nativeImage,globalShortcut,powerMonitor,screen}=require('electron');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');const {EventEmitter}=require('node:events');
const {Store}=require('../lib/store.cjs');const {NativeBridge}=require('../lib/bridge.cjs');const {Controller}=require('../lib/controller.cjs');
const {Popup}=require('./popup.cjs');
const root=path.resolve(__dirname,'..');const smoke=process.argv.includes('--smoke');
if(smoke)app.disableHardwareAcceleration();
fs.mkdirSync(path.join(root,'.local'),{recursive:true});
function log(message){fs.appendFileSync(path.join(root,'.local','startup.log'),new Date().toISOString()+' '+message+'\n');}
log('Main process started; smoke='+smoke);
process.on('uncaughtException',error=>{log(error.stack);console.error(error);app.exit(1);});
app.setName('Screen Color');app.setAppUserModelId('Peter.ScreenColor');
// A separate profile keeps automated smoke checks away from Peter's settings.
app.setPath('userData',smoke?path.join(root,'.local','smoke-user'):path.join(app.getPath('appData'),'ScreenColor'));
let window,popup,tray,controller,quitting=false,shortcut=false,reapplyTimer,watcher;
const uiFile=path.join(root,'ui','index.html'),uiURL=pathToFileURL(uiFile).href;
if(!app.requestSingleInstanceLock()){log('Another instance owns the app lock.');app.quit();}else{
 app.on('second-instance',(_event,argv)=>{if(argv.includes('--full-app'))showWindow();else showPopup().catch(error=>log(error.message));});
 app.whenReady().then(start).catch(error=>{log(error.stack);console.error(error);app.exit(1);});
}
function showWindow(){if(!window||window.isDestroyed())return;popup?.hide();if(window.isMinimized())window.restore();window.show();window.focus();}
async function showPopup(bounds,reconnect=true){if(!popup)return;if(window&&!window.isDestroyed())window.hide();await popup.show(bounds||tray?.getBounds());if(reconnect&&controller&&!controller.ready)await controller.dispatch('retry');}
function startupOptions(){return {path:process.execPath,args:[root,'--background'],name:'Screen Color'};}
function startupEnabled(){try{return app.getLoginItemSettings(startupOptions()).openAtLogin;}catch{return false;}}
function snapshot(){return {...controller.snapshot(),popupPinned:popup?.pinned||false,startupActual:startupEnabled(),shortcutAvailable:shortcut,development:true,smoke,displays:screen.getAllDisplays().map((d,i)=>({id:d.id,name:d.label||`Display ${i+1}`,width:d.size.width,height:d.size.height}))};}
function publish(){for(const target of [window,popup?.window])if(target&&!target.isDestroyed())target.webContents.send('screen-color:update',snapshot());updateTray();}
function icon(){const size=32,buffer=Buffer.alloc(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;const ring=Math.hypot(x-15.5,y-15.5);const on=ring>7&&ring<13;buffer[i]=buffer[i+1]=buffer[i+2]=buffer[i+3]=on?255:0;}return nativeImage.createFromBitmap(buffer,{width:size,height:size});}
function updateTray(){if(!tray||!controller)return;const state=controller.snapshot();tray.setToolTip(`Screen Color - ${state.enabled?'effect on':'original colors'}`);tray.setContextMenu(Menu.buildFromTemplate([
 {label:'Quick controls',click:()=>showPopup().catch(error=>log(error.message))},{label:'Open full app',click:showWindow},{type:'separator'},
 {label:'Color effect',type:'checkbox',checked:state.enabled,enabled:state.ready,click:item=>controller.dispatch('toggle',item.checked).catch(()=>{})},
 {label:'Peter reference',enabled:state.ready,click:()=>controller.dispatch('preset','reference').catch(()=>{})},
 {label:'Original colors',enabled:state.ready,click:()=>controller.dispatch('toggle',false).catch(()=>{})},
 {type:'separator'},{label:'Quit and restore colors',click:()=>app.quit()}
 ]));}
function validateSender(event){const owner=event.sender===window?.webContents?window:event.sender===popup?.window?.webContents?popup.window:null;const expected=owner===window?uiURL:popup?.url;if(!owner||owner.isDestroyed()||event.senderFrame!==owner.webContents.mainFrame||event.senderFrame.url!==expected)throw new Error('Untrusted app frame.');}
async function start(){
 let bridge;
 if(smoke){bridge=new EventEmitter();bridge.start=async()=>{};bridge.request=async()=>({ok:true});bridge.close=async()=>{};}
 else bridge=new NativeBridge(path.join(root,'native','bin','ColorHost.exe'),path.join(app.getPath('userData'),'recovery'));
 bridge.on('failure',error=>log('Color engine failure: '+error.message));
 controller=new Controller(bridge,new Store(path.join(app.getPath('userData'),'settings.json')));controller.on('state',publish);
 window=new BrowserWindow({width:1020,height:760,minWidth:760,minHeight:620,show:false,title:'Screen Color',backgroundColor:'#000000',autoHideMenuBar:true,icon:icon(),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,url)=>{if(url!==uiURL)event.preventDefault();});
 window.on('close',event=>{if(quitting)return;event.preventDefault();if(controller.state.preferences.minimizeToTray&&tray)window.hide();else app.quit();});
 popup=new Popup(root,publish);
 ipcMain.handle('screen-color:state',event=>{validateSender(event);return snapshot();});
 ipcMain.handle('screen-color:action',async(event,type,payload)=>{
  validateSender(event);try{
   if(type==='quit'){setImmediate(()=>app.quit());return {ok:true,state:snapshot()};}
   if(type==='openFullApp'){showWindow();return {ok:true,state:snapshot()};}
   if(type==='openPopup'){await showPopup();return {ok:true,state:snapshot()};}
   if(type==='hidePopup'){popup.hide();return {ok:true,state:snapshot()};}
   if(type==='pinPopup'){if(typeof payload!=='boolean')throw new Error('Invalid pin setting.');popup.setPinned(payload);return {ok:true,state:snapshot()};}
   if(type==='preferences'){
    if(!payload||typeof payload.startup!=='boolean'||typeof payload.minimizeToTray!=='boolean')throw new Error('Invalid preferences.');
    const previous=startupEnabled();try{app.setLoginItemSettings({...startupOptions(),openAtLogin:payload.startup});if(startupEnabled()!==payload.startup)throw new Error('Windows did not retain the startup setting.');await controller.dispatch(type,payload);}
    catch(error){app.setLoginItemSettings({...startupOptions(),openAtLogin:previous});throw error;}
   }else await controller.dispatch(type,payload);
   return {ok:true,state:snapshot()};
  }catch(error){return {ok:false,error:error.message,state:snapshot()};}
 });
 tray=new Tray(icon());tray.on('double-click',showWindow);tray.on('click',(_event,bounds)=>{if(popup.window.isVisible())popup.hide();else showPopup(bounds).catch(error=>log(error.message));});updateTray();
 shortcut=globalShortcut.register('Control+Alt+F12',()=>controller.dispatch('toggle',false).catch(()=>{}));
 const reapply=()=>{clearTimeout(reapplyTimer);reapplyTimer=setTimeout(()=>controller.dispatch('reapply').catch(()=>{}),800);};
 powerMonitor.on('resume',reapply);screen.on('display-added',reapply);screen.on('display-removed',reapply);screen.on('display-metrics-changed',reapply);
 watcher=fs.watch(path.join(root,'ui'),(_event,file)=>{if(file&&/\.(html|css|js)$/.test(file)){clearTimeout(start.reloadTimer);start.reloadTimer=setTimeout(()=>{for(const target of [window,popup.window])if(!target.isDestroyed())target.webContents.reloadIgnoringCache();},160);}});
 log('Loading '+uiURL);await Promise.all([window.loadURL(uiURL),popup.ready]);await controller.init();publish();
 log('App ready; color engine ready='+controller.ready+(controller.error?'; error='+controller.error:''));
 if(!smoke)setTimeout(()=>{if(!window.isDestroyed())window.webContents.capturePage().then(image=>fs.writeFileSync(path.join(root,'.local','app-window.png'),image.toPNG())).catch(error=>log('Capture unavailable: '+error.message));},500);
 if(!process.argv.includes('--background')||controller.error){if(process.argv.includes('--full-app'))showWindow();else await showPopup(undefined,false);}
 if(smoke)await runSmoke();
}
async function runSmoke(){
 const results=[];const errors=[];window.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
 try{
  const initial=await window.webContents.executeJavaScript('window.screenColor.getState()');if(initial.smoke!==true)throw new Error('Preload bridge unavailable');results.push('sandboxed preload state bridge');
  await window.webContents.executeJavaScript(`window.screenColor.action('preset','reference')`);let state=controller.snapshot();if(!state.enabled||state.values.saturation!==139)throw new Error('Reference preset failed');results.push('reference preset and acknowledged effect state');
  await window.webContents.executeJavaScript(`window.screenColor.action('saveProfile','Smoke wallpaper')`);if(!controller.state.profiles.some(p=>p.name==='Smoke wallpaper'))throw new Error('Profile save failed');results.push('local named profile persistence');
  await window.webContents.executeJavaScript(`document.querySelector('[data-key="saturation"] input[type="range"]').value=155;document.querySelector('[data-key="saturation"] input[type="range"]').dispatchEvent(new Event('input',{bubbles:true}))`);
  await new Promise(r=>setTimeout(r,300));if(controller.state.values.saturation!==155)throw new Error('Live slider IPC failed');results.push('renderer slider to main/controller');
  window.webContents.reloadIgnoringCache();await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));await new Promise(r=>setTimeout(r,200));if(controller.state.values.saturation!==155||!controller.state.enabled)throw new Error('Reload lost the active effect');results.push('renderer reload preserves engine state');
  await window.webContents.executeJavaScript(`window.screenColor.action('toggle',false)`);if(controller.state.enabled)throw new Error('Original toggle failed');results.push('original toggle');
  popup.setPinned(true);await showPopup();await new Promise(r=>setTimeout(r,150));
  if(!popup.window.isVisible()||window.isVisible()||!popup.window.isAlwaysOnTop())throw new Error('Quick controls did not open over the desktop');results.push('compact always-on-top window hides the full app');
  controller.ready=false;controller.error='Previous startup failed';publish();await showPopup();if(!controller.ready||controller.error)throw new Error('Popup reopen did not reconnect');results.push('opening quick controls reconnects a failed engine');
  controller.warning='Saved settings could not be read. Started safely with the effect off.';publish();await new Promise(r=>setTimeout(r,100));
  if(!await popup.window.webContents.executeJavaScript(`!!document.querySelector('#quick-warning')&&!document.querySelector('#quick-warning').hidden&&document.querySelector('#quick-warning').textContent.includes('Saved settings')`))throw new Error('Popup did not explain recovered settings');controller.warning=null;publish();results.push('popup displays recovered-settings warnings');
  const previousAppearance=await window.webContents.executeJavaScript(`localStorage.getItem('screen-color-appearance')`);
  await window.webContents.executeJavaScript(`localStorage.setItem('screen-color-appearance',JSON.stringify({theme:'deep',accent:null}))`);await new Promise(r=>setTimeout(r,120));
  if(await popup.window.webContents.executeJavaScript(`document.documentElement.dataset.theme`)!=='deep')throw new Error('Popup appearance did not follow full app');results.push('popup follows the full app theme');
  await window.webContents.executeJavaScript(previousAppearance===null?`localStorage.removeItem('screen-color-appearance')`:`localStorage.setItem('screen-color-appearance',${JSON.stringify(previousAppearance)})`);await new Promise(r=>setTimeout(r,160));
  await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-saturation').value=166;document.querySelector('#quick-saturation').dispatchEvent(new Event('input',{bubbles:true}))`);await new Promise(r=>setTimeout(r,200));
  if(controller.state.values.saturation!==166)throw new Error('Popup slider failed');const synced=await window.webContents.executeJavaScript(`document.querySelector('#saturation').value`);if(synced!=='166')throw new Error('Full app did not receive popup changes');results.push('popup slider and full app share acknowledged state');
  await popup.window.webContents.executeJavaScript(`window.screenColor.action('pinPopup',true)`);if(!popup.pinned)throw new Error('Pin failed');popup.window.emit('blur');await new Promise(r=>setTimeout(r,220));if(!popup.window.isVisible())throw new Error('Pinned popup hid on blur');results.push('pin keeps controls visible after losing focus');
  await popup.window.webContents.executeJavaScript(`window.screenColor.action('preset','reference')`);await new Promise(r=>setTimeout(r,200));
  fs.writeFileSync(path.join(root,'.local','popup.png'),(await popup.window.webContents.capturePage()).toPNG());
  await popup.window.webContents.executeJavaScript(`window.screenColor.action('hidePopup')`);if(popup.window.isVisible()||!controller.state.enabled)throw new Error('Hiding popup disabled the effect');results.push('hiding popup preserves the active effect');
  await window.webContents.executeJavaScript(`window.screenColor.action('openPopup')`);await popup.window.webContents.executeJavaScript(`window.screenColor.action('openFullApp')`);if(!window.isVisible()||popup.window.isVisible())throw new Error('Open full app failed');results.push('popup opens the full app without losing adjustments');
  await window.webContents.executeJavaScript(`window.screenColor.action('openPopup')`);popup.setPinned(false);popup.window.blur();window.show();window.focus();popup.window.emit('blur');await new Promise(r=>setTimeout(r,220));if(popup.window.isVisible())throw new Error('Unpinned popup did not hide');results.push('unpinned popup dismisses on blur');
  // Capture the chosen reference with the mock engine; no actual desktop color changes.
  await window.webContents.executeJavaScript(`window.screenColor.action('preset','reference')`);await new Promise(r=>setTimeout(r,150));
  fs.mkdirSync(path.join(root,'.local'),{recursive:true});fs.writeFileSync(path.join(root,'.local','screen-color.png'),(await window.webContents.capturePage()).toPNG());
  if(errors.length)throw new Error(errors.join('\n'));fs.writeFileSync(path.join(root,'.local','smoke.json'),JSON.stringify({ok:true,engine:'mock: no physical desktop transform',checks:results},null,2));
 }catch(error){fs.mkdirSync(path.join(root,'.local'),{recursive:true});fs.writeFileSync(path.join(root,'.local','smoke.json'),JSON.stringify({ok:false,error:error.stack,checks:results},null,2));process.exitCode=1;}
 app.quit();
}
app.on('before-quit',event=>{if(quitting)return;event.preventDefault();quitting=true;clearTimeout(reapplyTimer);watcher?.close();globalShortcut.unregisterAll();Promise.resolve(controller?.close()).catch(console.error).finally(()=>{tray?.destroy();app.exit(process.exitCode||0);});});
app.on('window-all-closed',()=>{if(!tray)app.quit();});
