import {app,BrowserWindow,ipcMain,Tray,Menu,nativeImage,globalShortcut,powerMonitor,screen,shell,Notification,type IpcMainInvokeEvent,type Rectangle} from 'electron';
import fs = require('node:fs');
import path = require('node:path');
import {pathToFileURL} from 'node:url';
import {EventEmitter} from 'node:events';
import {Store} from '../lib/store.cjs';
import {NativeBridge,type EngineBridge} from '../lib/bridge.cjs';
import {Controller} from '../lib/controller.cjs';
import {Popup} from './popup.cjs';
import {supportURL} from '../lib/support.cjs';
import {ExperienceStore} from '../lib/experience.cjs';
import {UpdateChecker} from '../lib/updates.cjs';
import {StartupRegistration} from '../lib/startup.cjs';
import {startupOptions as makeStartupOptions,runtimePaths} from '../lib/platform.cjs';
import {object,errorMessage} from '../lib/validation.cjs';
import {runSmoke as runElectronSmoke} from './smoke.cjs';
import type {ScreenColorSnapshot,ActionResult,Preferences} from '../shared/types';
function details(error: unknown): string {return error instanceof Error?error.stack||error.message:String(error);}
const runtimeRoot=path.resolve(__dirname,'..'),root=app.getAppPath();const smoke=process.argv.includes('--smoke');
if(smoke)app.disableHardwareAcceleration();
app.setPath('userData',smoke?(app.isPackaged?path.join(app.getPath('appData'),'ScreenColor','smoke-user'):path.join(root,'.local','smoke-user')):path.join(app.getPath('appData'),'ScreenColor'));
const paths=runtimePaths({packaged:app.isPackaged,root,resources:process.resourcesPath,userData:app.getPath('userData')});const diagnosticsDir=paths.diagnostics;
fs.mkdirSync(diagnosticsDir,{recursive:true});
function log(message: string): void{fs.appendFileSync(path.join(diagnosticsDir,'startup.log'),new Date().toISOString()+' '+message+'\n');}
log('Main process started; smoke='+smoke);
process.on('uncaughtException',error=>{log(details(error));console.error(error);app.exit(1);});
app.setName('Screen Color');app.setAppUserModelId('Peter.ScreenColor');
// Packaged and source apps deliberately share ScreenColor userData; smoke stays isolated.
let window: BrowserWindow,popup: Popup,tray: Tray,controller: Controller,experience: ExperienceStore,updater: UpdateChecker,startupRegistration: StartupRegistration;
let quitting=false,shortcut=false,initialized=false,reapplyTimer: ReturnType<typeof setTimeout>|undefined,updateTimer: ReturnType<typeof setInterval>|undefined,watcher: {close(): void}|undefined;
let startupInfo={registered:false,enabled:false},startupWarning: string|null=null,preferencesQueue: Promise<void>=Promise.resolve();const pendingLaunches: string[][]=[],notifiedThisProcess=new Set<string>();
const uiFile=path.join(runtimeRoot,'ui','index.html'),uiURL=pathToFileURL(uiFile).href;
log('Acquiring instance lock');if(!app.requestSingleInstanceLock()){log('Another instance owns the app lock.');app.quit();}else{
 log('Instance lock acquired');
 app.on('second-instance',(_event,argv)=>{if(argv.includes('--background'))return;if(!initialized)pendingLaunches.push(argv);else handleLaunch(argv);});
 app.whenReady().then(start).catch(error=>{log(details(error));console.error(error);app.exit(1);});
}
function showWindow(){if(!window||window.isDestroyed())return;popup?.hide();if(window.isMinimized())window.restore();window.show();window.focus();if(initialized)publish();}
function handleLaunch(argv: string[]){try{experience.recordLaunch(false);}catch(error){log('Launch count could not be saved: '+errorMessage(error));}if(argv.includes('--full-app'))showWindow();else showPopup().catch(error=>log(errorMessage(error)));publish();}
async function showPopup(bounds?: Rectangle,reconnect=true){if(!popup)return;if(window&&!window.isDestroyed())window.hide();await popup.show(bounds||tray?.getBounds());if(reconnect&&controller&&!controller.ready)await controller.dispatch('retry');}
function startupOptions(){return makeStartupOptions({packaged:app.isPackaged,executable:process.execPath,root});}
function startupEnabled(){return startupInfo.enabled;}
function refreshStartup(){if(smoke)return;try{startupInfo=startupRegistration.status();startupWarning=null;}catch(error){startupWarning='Could not read Start with Windows. Check Startup apps in Windows Settings.';log('Startup check failed: '+errorMessage(error));}}
function snapshot(): ScreenColorSnapshot{return {...controller.snapshot(),popupPinned:popup?.pinned||false,startupActual:startupEnabled(),startupWarning,shortcutAvailable:shortcut,development:!app.isPackaged,version:app.getVersion(),smoke,workspaceVisible:!!window?.isVisible(),experience:experience.snapshot(),experiencePrompts:!smoke||process.argv.includes('--experience-test'),updates:updater.snapshot(),displays:screen.getAllDisplays().map((d,i)=>({id:d.id,name:d.label||`Display ${i+1}`,width:d.size.width,height:d.size.height}))};}
async function configureInstalledStartup(){
 if(!app.isPackaged||smoke)return;
 try{const marker=path.join(app.getPath('userData'),'installed-startup.ini');const firstInstall=!fs.existsSync(marker);const original=startupRegistration.registry.read();startupInfo=startupRegistration.repairLegacy();if(firstInstall&&original.command===null)await startupRegistration.set(true,async()=>{});refreshStartup();if(firstInstall){const warning=controller.warning;if(warning){const stamp=Date.now();for(const name of ['settings.json','settings.json.bak']){const file=path.join(app.getPath('userData'),name);if(fs.existsSync(file))fs.copyFileSync(file,file+'.recovered-'+stamp);}}await controller.dispatch('preferences',{...controller.state.preferences,startup:startupEnabled()});controller.warning=warning;writeStartupMarker(startupEnabled());}}
 catch(error){startupWarning='Start with Windows could not be configured. You can retry in Settings.';log('Windows startup configuration: '+errorMessage(error));}
}
function writeStartupMarker(enabled: boolean){if(app.isPackaged&&!smoke)fs.writeFileSync(path.join(app.getPath('userData'),'installed-startup.ini'),'[Startup]\r\nEnabled='+(enabled?'1':'0')+'\r\n','utf8');}
function changePreferences(payload: Preferences){
 const task=preferencesQueue.then(async()=>{
  refreshStartup();
  if(smoke&&payload.startup!==startupEnabled())throw new Error('Startup changes are disabled in the isolated smoke test.');
  if(payload.startup===startupEnabled()){await controller.dispatch('preferences',payload);return;}
  const marker=path.join(app.getPath('userData'),'installed-startup.ini'),previousMarker=fs.existsSync(marker)?fs.readFileSync(marker):null;
  try{await startupRegistration.set(payload.startup,async()=>{writeStartupMarker(payload.startup);await controller.dispatch('preferences',payload);});refreshStartup();}
  catch(error){if(app.isPackaged){if(previousMarker)fs.writeFileSync(marker,previousMarker);else if(fs.existsSync(marker))fs.unlinkSync(marker);}refreshStartup();throw error;}
 });
 preferencesQueue=task.catch(()=>{});return task;
}
function publish(){for(const target of [window,popup?.window])if(target&&!target.isDestroyed())target.webContents.send('screen-color:update',snapshot());updateTray();}
function icon(){const size=32,buffer=Buffer.alloc(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;const ring=Math.hypot(x-15.5,y-15.5);const on=ring>7&&ring<13;buffer[i]=buffer[i+1]=buffer[i+2]=buffer[i+3]=on?255:0;}return nativeImage.createFromBitmap(buffer,{width:size,height:size});}
function updateTray(){if(!tray||!controller)return;const state=controller.snapshot();tray.setToolTip(`Screen Color - ${state.enabled?'effect on':'original colors'}`);tray.setContextMenu(Menu.buildFromTemplate([
 {label:'Quick controls',click:()=>showPopup().catch(error=>log(errorMessage(error)))},{label:'Open full app',click:showWindow},{type:'separator'},
 {label:'Color effect',type:'checkbox',checked:state.enabled,enabled:state.ready,click:item=>controller.dispatch('toggle',item.checked).catch(()=>{})},
 {label:'Custom preset one',enabled:state.ready,click:()=>controller.dispatch('preset','reference').catch(()=>{})},
 {label:'Original colors',enabled:state.ready,click:()=>controller.dispatch('toggle',false).catch(()=>{})},
 {label:updater?.snapshot().available?'Update available — open app':'Check for updates',click:()=>{showWindow();updater.check().catch(error=>log(errorMessage(error)));}},
 {type:'separator'},{label:'Quit and restore colors',click:()=>app.quit()}
 ]));}
function validateSender(event: IpcMainInvokeEvent){const owner=event.sender===window?.webContents?window:event.sender===popup?.window?.webContents?popup.window:null;const expected=owner===window?uiURL:popup?.url;if(!owner||owner.isDestroyed()||event.senderFrame!==owner.webContents.mainFrame||event.senderFrame?.url!==expected)throw new Error('Untrusted app frame.');}
async function start(){
 log('Electron ready; preparing windows');
 experience=new ExperienceStore(path.join(app.getPath('userData'),'experience.json'));if(!smoke)try{experience.recordLaunch(process.argv.includes('--background'));}catch(error){log('Experience save: '+errorMessage(error));}
 startupRegistration=new StartupRegistration(startupOptions());refreshStartup();
 updater=new UpdateChecker({current:app.getVersion(),...(smoke?{fetch:async()=>new Response(JSON.stringify({tag_name:'v1000.0.0',draft:false,prerelease:false,html_url:'https://github.com/Peter3324w/ScreenColor/releases/tag/v1000.0.0',assets:[{name:'Screen-Color-Setup-1000.0.0-x64.exe',size:82543707,browser_download_url:'https://github.com/Peter3324w/ScreenColor/releases/download/v1000.0.0/Screen-Color-Setup-1000.0.0-x64.exe'}]}))}:{})});
 updater.on('state',()=>{if(initialized){publish();notifyUpdate();}});
 let bridge: EngineBridge;
 if(smoke){bridge=Object.assign(new EventEmitter(),{start:async()=>{},request:async()=>({ok:true}),close:async()=>{}});}
 else bridge=new NativeBridge(paths.native,path.join(app.getPath('userData'),'recovery'));
 bridge.on('failure',error=>log('Color engine failure: '+errorMessage(error)));
 controller=new Controller(bridge,new Store(path.join(app.getPath('userData'),'settings.json')));controller.on('state',publish);
 log('Creating full window');window=new BrowserWindow({width:1020,height:760,minWidth:760,minHeight:620,show:false,title:'Screen Color',backgroundColor:'#000000',autoHideMenuBar:true,icon:icon(),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});log('Full window created');
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,url)=>{if(url!==uiURL)event.preventDefault();});
 window.on('close',event=>{if(quitting)return;event.preventDefault();if(controller.state.preferences.minimizeToTray&&tray)window.hide();else app.quit();});
 window.on('focus',()=>{if(initialized){refreshStartup();publish();}});window.on('hide',()=>{if(initialized)publish();});
 popup=new Popup(runtimeRoot,publish);log('Popup window created');
 ipcMain.handle('screen-color:state',event=>{validateSender(event);return snapshot();});
 ipcMain.handle('screen-color:action',async(event,type: unknown,payload: unknown): Promise<ActionResult>=>{
  validateSender(event);try{
   if(type==='openSupport'){await shell.openExternal(supportURL(payload));return {ok:true,state:snapshot()};}
   if(type==='finishTour'){experience.finishTour();publish();return {ok:true,state:snapshot()};}
   if(type==='dismissSupport'){experience.dismissSupport();publish();return {ok:true,state:snapshot()};}
   if(type==='checkUpdates'){await updater.check();return {ok:true,state:snapshot()};}
   if(type==='downloadUpdate'){const update=updater.snapshot().available;if(!update)throw new Error('No update is available. Check for updates first.');await shell.openExternal(update.url);return {ok:true,state:snapshot()};}
   if(type==='dismissUpdate'){const update=updater.snapshot().available;if(!update)throw new Error('No update notification to dismiss.');experience.dismissUpdate(update.version);publish();return {ok:true,state:snapshot()};}
   if(type==='quit'){setImmediate(()=>app.quit());return {ok:true,state:snapshot()};}
   if(type==='openFullApp'){showWindow();return {ok:true,state:snapshot()};}
   if(type==='openPopup'){await showPopup();return {ok:true,state:snapshot()};}
   if(type==='hidePopup'){popup.hide();return {ok:true,state:snapshot()};}
   if(type==='pinPopup'){if(typeof payload!=='boolean')throw new Error('Invalid pin setting.');popup.setPinned(payload);return {ok:true,state:snapshot()};}
   if(type==='preferences'){
    if(!object(payload)||typeof payload.startup!=='boolean'||typeof payload.minimizeToTray!=='boolean')throw new Error('Invalid preferences.');
    await changePreferences({startup:payload.startup,minimizeToTray:payload.minimizeToTray});
   }else await controller.dispatchUntrusted(type,payload);
   return {ok:true,state:snapshot()};
  }catch(error){return {ok:false,error:errorMessage(error),state:snapshot()};}
 });
 tray=new Tray(icon());log('Tray created');tray.on('double-click',showWindow);tray.on('click',(_event,bounds)=>{if(popup.window.isVisible())popup.hide();else showPopup(bounds).catch(error=>log(errorMessage(error)));});updateTray();
 shortcut=globalShortcut.register('Control+Alt+F12',()=>controller.dispatch('toggle',false).catch(()=>{}));
 const reapply=()=>{clearTimeout(reapplyTimer);reapplyTimer=setTimeout(()=>controller.dispatch('reapply').catch(()=>{}),800);};
 powerMonitor.on('resume',reapply);screen.on('display-added',reapply);screen.on('display-removed',reapply);screen.on('display-metrics-changed',reapply);
 if(!app.isPackaged&&!smoke){
 const {watchApp}: {watchApp(callback: ()=>void): {close(): void}}=require(path.join(root,'scripts','compile-app.cjs'));
 watcher=watchApp(()=>{for(const target of [window,popup.window])if(!target.isDestroyed())target.webContents.reloadIgnoringCache();});
}
 log('Loading '+uiURL);await Promise.all([window.loadURL(uiURL),popup.ready]);await configureInstalledStartup();await controller.init();publish();
 log('App ready; color engine ready='+controller.ready+(controller.error?'; error='+controller.error:''));
 if(!smoke&&!app.isPackaged)setTimeout(()=>{if(!window.isDestroyed())window.webContents.capturePage().then(image=>fs.writeFileSync(path.join(diagnosticsDir,'app-window.png'),image.toPNG())).catch(error=>log('Capture unavailable: '+errorMessage(error)));},500);
 initialized=true;
 if(!process.argv.includes('--background')||controller.error){if(process.argv.includes('--full-app'))showWindow();else await showPopup(undefined,false);}
 for(const argv of pendingLaunches.splice(0))handleLaunch(argv);
 if(!smoke){updater.check().catch(error=>log(errorMessage(error)));updateTimer=setInterval(()=>updater.check().catch(error=>log(errorMessage(error))),6*60*60*1000);updateTimer.unref();}
 if(smoke)await runSmoke();
}
function notifyUpdate(){const update=updater.snapshot().available;if(smoke||!update||experience.snapshot().notifiedVersion===update.version||notifiedThisProcess.has(update.version))return;notifiedThisProcess.add(update.version);try{if(!Notification.isSupported())return;const notification=new Notification({title:'Screen Color update available',body:`Version ${update.version} is ready. Open Screen Color to download it.`,silent:true});notification.on('click',showWindow);notification.on('failed',(_event,error)=>log('Update notification: '+error));notification.show();try{experience.markNotified(update.version);}catch(error){log('Notification preference save: '+errorMessage(error));}}catch(error){log('Update notification unavailable: '+errorMessage(error));}}
async function runSmoke(): Promise<void>{await runElectronSmoke({window,popup,controller,diagnosticsDir,log,showPopup,publish});}
app.on('before-quit',event=>{if(quitting)return;event.preventDefault();quitting=true;clearTimeout(reapplyTimer);clearInterval(updateTimer);watcher?.close();globalShortcut.unregisterAll();Promise.resolve(controller?.close()).catch(console.error).finally(()=>{tray?.destroy();app.exit(Number(process.exitCode)||0);});});
app.on('window-all-closed',()=>{if(!tray)app.quit();});
