'use strict';
const assert=require('node:assert/strict');const {chromium}=require('../../Playtime/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.addInitScript(()=>{
   const state={enabled:false,ready:true,values:{saturation:100,contrast:100,warmth:0,brightness:100,tint:0},profileId:'neutral',profiles:[],preferences:{startup:false,minimizeToTray:true}};
   window.saveCalls=0;window.screenColor={getState:async()=>structuredClone(state),subscribe(){},async action(type,name){if(type==='saveProfile'){window.saveCalls++;await new Promise(resolve=>setTimeout(resolve,150));if(window.rejectNextSave){window.rejectNextSave=false;return {ok:false,error:'Disk full',state:structuredClone(state)};}const profile={id:String(window.saveCalls),name,values:{...state.values}};state.profiles.push(profile);state.profileId=profile.id;}return {ok:true,state:structuredClone(state)};}};
  });
  await page.goto('file:///C:/Users/peter/Projects/ScreenColor/ui/index.html');await page.waitForSelector('#saturation');
  await page.locator('#save-profile').evaluate(button=>button.click());await page.fill('#profile-name','Rapid save');
  await page.locator('#profile-form').evaluate(form=>{for(let i=0;i<2;i++)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  await page.waitForFunction(()=>!document.querySelector('#profile-dialog').open);
  assert.equal(await page.evaluate(()=>window.saveCalls),1,'Repeated submission must save only one profile');
  assert.equal(await page.locator('.profile-row').filter({hasText:'Rapid save'}).count(),1);
  await page.locator('#save-profile').evaluate(button=>button.click());await page.fill('#profile-name','Retry save');await page.evaluate(()=>window.rejectNextSave=true);await page.locator('#profile-form').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.waitForFunction(()=>document.querySelector('#profile-error').textContent.includes('Could not save'));assert.equal(await page.locator('#profile-form button[type=submit]').isEnabled(),true);assert.equal(await page.locator('#profile-dialog').evaluate(dialog=>dialog.open),true);await page.locator('#profile-form').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.waitForFunction(()=>!document.querySelector('#profile-dialog').open);assert.equal(await page.locator('.profile-row').filter({hasText:'Retry save'}).count(),1);
  console.log('PASS: repeated submission saves one profile; a failed save leaves the dialog open and can be retried.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
