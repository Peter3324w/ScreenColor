'use strict';
const {app,shell}=require('electron'),fs=require('node:fs'),path=require('node:path');
const {Store}=require('../lib/store.cjs'),{supportURL}=require('../lib/support.cjs');
async function runSmoke({window,popup,controller,diagnosticsDir,log,showPopup,publish}){
 const results=[];const errors=[];const step=check=>{results.push(check);log('Smoke: '+check);};window.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
 try{
  const initial=await window.webContents.executeJavaScript('window.screenColor.getState()');if(initial.smoke!==true)throw new Error('Preload bridge unavailable');step('sandboxed preload state bridge');
  await window.webContents.executeJavaScript("document.querySelector('.nav-item[data-view=profiles]').click();document.querySelector('#filter-gallery [data-filter=filter-cinema]').click()");await new Promise(r=>setTimeout(r,150));
  if(controller.snapshot().profileId!=='filter-cinema'||controller.snapshot().values.saturation!==88)throw new Error('Filter gallery did not apply through IPC');
  if(await popup.window.webContents.executeJavaScript("document.querySelector('#quick-profile').value")!=='filter-cinema')throw new Error('Selected filter missing from quick controls');
  window.webContents.reloadIgnoringCache();await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));await new Promise(r=>setTimeout(r,150));
  if(!await window.webContents.executeJavaScript("document.querySelector('#filter-gallery [data-filter=filter-cinema]').getAttribute('aria-pressed')==='true'"))throw new Error('Filter selection did not survive renderer reload');
  if(!await window.webContents.executeJavaScript("!document.querySelector('#filter-compare').hidden"))throw new Error('Desktop comparison guidance missing');
  await window.webContents.executeJavaScript("document.querySelector('#compare-filters').click()");await new Promise(r=>setTimeout(r,150));
  if(controller.snapshot().enabled||controller.snapshot().profileId!=='filter-cinema')throw new Error('Sample comparison did not disable the effect while preserving the chosen filter');
  await popup.window.webContents.executeJavaScript("const selector=document.querySelector('#quick-profile');selector.value='filter-golden';selector.dispatchEvent(new Event('change',{bubbles:true}))");await new Promise(r=>setTimeout(r,150));
  if(controller.snapshot().profileId!=='filter-golden'||await window.webContents.executeJavaScript("document.querySelector('#profile-label').textContent")!=='Golden')throw new Error('Quick-control filter did not synchronize');
  step('starter filters apply through gallery IPC, survive renderer reload and synchronize with quick controls');
  const opened=[],originalOpen=shell.openExternal;
  try{
   shell.openExternal=async url=>{opened.push(url);};
   await window.webContents.executeJavaScript("document.querySelector('.nav-item[data-view=feedback]').click();document.querySelector('[data-support=feedback]').click()");
   await new Promise(r=>setTimeout(r,100));
   for(const id of ['help','issues'])await window.webContents.executeJavaScript("window.screenColor.action('openSupport',"+JSON.stringify(id)+")");
   if(opened.join('|')!==['feedback','help','issues'].map(supportURL).join('|'))throw new Error('Support destinations did not reach the system browser boundary');
   const rejected=await window.webContents.executeJavaScript("window.screenColor.action('openSupport','https://example.com')");if(rejected.ok||opened.length!==3)throw new Error('Arbitrary support destination accepted');
   shell.openExternal=async()=>{throw new Error('Browser unavailable');};
   await window.webContents.executeJavaScript("document.querySelector('[data-support=feedback]').click()");await new Promise(r=>setTimeout(r,100));
   if(!await window.webContents.executeJavaScript("!document.querySelector('#feedback-error').hidden&&document.querySelector('#feedback-error').textContent.includes('Could not open')"))throw new Error('Missing browser failure message');
  }finally{shell.openExternal=originalOpen;}
  step('feedback and support links cross validated IPC to fixed system-browser destinations; unknown IDs rejected and browser failures shown');
  const savedAppearance=await window.webContents.executeJavaScript("localStorage.getItem('screen-color-appearance')");
  await window.webContents.executeJavaScript("document.querySelector('#sidebar-theme-toggle').click();document.querySelector('#sidebar-theme-picker [data-theme=rose]').click()");await new Promise(r=>setTimeout(r,150));
  if(await popup.window.webContents.executeJavaScript("document.documentElement.dataset.theme")!=='rose')throw new Error('Sidebar theme did not reach quick controls');
  window.webContents.reloadIgnoringCache();await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));await new Promise(r=>setTimeout(r,150));
  if(!await window.webContents.executeJavaScript("document.querySelector('#sidebar-theme-picker [data-theme=rose]').getAttribute('aria-pressed')==='true'&&document.querySelector('#theme-picker [data-theme=rose]').getAttribute('aria-pressed')==='true'"))throw new Error('Sidebar theme did not persist and sync');
  await window.webContents.executeJavaScript(savedAppearance===null?"localStorage.removeItem('screen-color-appearance')":"localStorage.setItem('screen-color-appearance',"+JSON.stringify(savedAppearance)+")");
  window.webContents.reloadIgnoringCache();await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));await new Promise(r=>setTimeout(r,150));
  step('sidebar theme synchronizes with Settings and quick controls and survives reload');
  await window.webContents.executeJavaScript(`window.screenColor.action('preset','reference')`);let state=controller.snapshot();if(!state.enabled||state.values.saturation!==139)throw new Error('Reference preset failed');step('reference preset and acknowledged effect state');
  await window.webContents.executeJavaScript(`window.screenColor.action('saveProfile','Smoke wallpaper')`);if(!controller.state.profiles.some(p=>p.name==='Smoke wallpaper'))throw new Error('Profile save failed');step('local named profile persistence');
  await window.webContents.executeJavaScript(`document.querySelector('[data-key="saturation"] input[type="range"]').value=155;document.querySelector('[data-key="saturation"] input[type="range"]').dispatchEvent(new Event('input',{bubbles:true}))`);
  await new Promise(r=>setTimeout(r,300));if(controller.state.values.saturation!==155)throw new Error('Live slider IPC failed');step('renderer slider to main/controller');
  window.webContents.reloadIgnoringCache();await new Promise(resolve=>window.webContents.once('did-finish-load',resolve));await new Promise(r=>setTimeout(r,200));if(controller.state.values.saturation!==155||!controller.state.enabled)throw new Error('Reload lost the active effect');step('renderer reload preserves engine state');
  await window.webContents.executeJavaScript(`window.screenColor.action('toggle',false)`);if(controller.state.enabled)throw new Error('Original toggle failed');step('original toggle');
  popup.setPinned(true);await showPopup();await new Promise(r=>setTimeout(r,150));
  if(!popup.window.isVisible()||window.isVisible()||!popup.window.isAlwaysOnTop())throw new Error('Quick controls did not open over the desktop');step('compact always-on-top window hides the full app');
  controller.ready=false;controller.error='Previous startup failed';publish();await showPopup();if(!controller.ready||controller.error)throw new Error('Popup reopen did not reconnect');step('opening quick controls reconnects a failed engine');
  controller.warning='Saved settings could not be read. Started safely with the effect off.';publish();await new Promise(r=>setTimeout(r,100));
  if(!await popup.window.webContents.executeJavaScript(`!!document.querySelector('#quick-warning')&&!document.querySelector('#quick-warning').hidden&&document.querySelector('#quick-warning').textContent.includes('Saved settings')`))throw new Error('Popup did not explain recovered settings');controller.warning=null;publish();step('popup displays recovered-settings warnings');
  const previousAppearance=await window.webContents.executeJavaScript(`localStorage.getItem('screen-color-appearance')`);
  await window.webContents.executeJavaScript(`localStorage.setItem('screen-color-appearance',JSON.stringify({theme:'deep',accent:null}))`);await new Promise(r=>setTimeout(r,120));
  if(await popup.window.webContents.executeJavaScript(`document.documentElement.dataset.theme`)!=='deep')throw new Error('Popup appearance did not follow full app');step('popup follows the full app theme');
  await window.webContents.executeJavaScript(previousAppearance===null?`localStorage.removeItem('screen-color-appearance')`:`localStorage.setItem('screen-color-appearance',${JSON.stringify(previousAppearance)})`);await new Promise(r=>setTimeout(r,160));
  await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-saturation').value=166;document.querySelector('#quick-saturation').dispatchEvent(new Event('input',{bubbles:true}))`);await new Promise(r=>setTimeout(r,200));
  if(controller.state.values.saturation!==166)throw new Error('Popup slider failed');const synced=await window.webContents.executeJavaScript(`document.querySelector('#saturation').value`);if(synced!=='166')throw new Error('Full app did not receive popup changes');step('popup slider and full app share acknowledged state');
  await popup.window.webContents.executeJavaScript(`window.screenColor.action('pinPopup',true)`);if(!popup.pinned)throw new Error('Pin failed');popup.window.emit('blur');await new Promise(r=>setTimeout(r,220));if(!popup.window.isVisible())throw new Error('Pinned popup hid on blur');step('pin keeps controls visible after losing focus');
  await popup.window.webContents.executeJavaScript(`window.screenColor.action('preset','reference')`);await new Promise(r=>setTimeout(r,200));
  fs.writeFileSync(path.join(diagnosticsDir,'popup.png'),(await popup.window.webContents.capturePage()).toPNG());
  await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-warmth').value=172;document.querySelector('#quick-warmth').dispatchEvent(new Event('input',{bubbles:true}))`);await new Promise(r=>setTimeout(r,120));
  await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-save-profile').click();document.querySelector('#quick-profile-name').value='Toolbar look';document.querySelector('#quick-profile-form').requestSubmit()`);await new Promise(r=>setTimeout(r,180));
  const toolbarProfile=controller.state.profiles.findLast(p=>p.name==='Toolbar look');if(!toolbarProfile||toolbarProfile.values.warmth!==172||controller.state.profileId!==toolbarProfile.id)throw new Error('Toolbar profile was not saved with the latest adjustments');
  const savedToolbarState=new Store(path.join(app.getPath('userData'),'settings.json')).load().state;if(!savedToolbarState.profiles.some(p=>p.id===toolbarProfile.id&&p.values.warmth===172))throw new Error('Toolbar profile was not persisted to disk');
  if(await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-profile').value`)!==toolbarProfile.id)throw new Error('Saved profile was not selected in toolbar');step('toolbar creates and selects a named profile with current adjustments');
  popup.window.webContents.reloadIgnoringCache();await new Promise(resolve=>popup.window.webContents.once('did-finish-load',resolve));await new Promise(r=>setTimeout(r,180));if(await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-profile').value`)!==toolbarProfile.id)throw new Error('Saved toolbar profile did not survive reload');step('toolbar saved profile survives reload');
  await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-save-profile').click();document.querySelector('#quick-profile-name').value='   ';document.querySelector('#quick-profile-form').requestSubmit()`);await new Promise(r=>setTimeout(r,120));if(!await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-profile-dialog').open&&document.querySelector('#quick-profile-error').textContent.length>0`))throw new Error('Invalid profile name was not explained in the toolbar');await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-profile-cancel').click()`);step('toolbar profile form validates names and cancels safely');
  await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-save-profile').click();document.querySelector('#quick-profile-name').value='Evening colors'`);fs.writeFileSync(path.join(diagnosticsDir,'toolbar-save-dialog.png'),(await popup.window.webContents.capturePage()).toPNG());popup.window.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});popup.window.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await new Promise(r=>setTimeout(r,100));if(await popup.window.webContents.executeJavaScript(`document.querySelector('#quick-profile-dialog').open`)||!popup.window.isVisible())throw new Error('Escape should close the profile form without hiding the toolbar');step('Escape closes the profile dialog and keeps the toolbar open');
  await popup.window.webContents.executeJavaScript(`window.screenColor.action('hidePopup')`);if(popup.window.isVisible()||!controller.state.enabled)throw new Error('Hiding popup disabled the effect');step('hiding popup preserves the active effect');
  await window.webContents.executeJavaScript(`window.screenColor.action('openPopup')`);await popup.window.webContents.executeJavaScript(`window.screenColor.action('openFullApp')`);if(!window.isVisible()||popup.window.isVisible())throw new Error('Open full app failed');step('popup opens the full app without losing adjustments');
  await window.webContents.executeJavaScript(`window.screenColor.action('openPopup')`);popup.setPinned(false);popup.window.blur();window.show();window.focus();popup.window.emit('blur');await new Promise(r=>setTimeout(r,220));if(popup.window.isVisible())throw new Error('Unpinned popup did not hide');step('unpinned popup dismisses on blur');
  // Capture the chosen reference with the mock engine; no actual desktop color changes.
  await window.webContents.executeJavaScript(`window.screenColor.action('preset','reference')`);await new Promise(r=>setTimeout(r,150));
  fs.writeFileSync(path.join(diagnosticsDir,'screen-color.png'),(await window.webContents.capturePage()).toPNG());
  if(errors.length)throw new Error(errors.join('\n'));fs.writeFileSync(path.join(diagnosticsDir,'smoke.json'),JSON.stringify({ok:true,engine:'mock: no physical desktop transform',checks:results},null,2));
 }catch(error){fs.writeFileSync(path.join(diagnosticsDir,'smoke.json'),JSON.stringify({ok:false,error:error.stack,checks:results},null,2));process.exitCode=1;}
 app.quit();
}

module.exports={runSmoke};
