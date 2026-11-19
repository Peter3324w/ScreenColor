'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../../Playtime/node_modules/playwright');
require('./compile-app.cjs').compileApp();
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const failures=[];
 try{
  for(const popup of [false,true])for(const startupFailure of [false,true]){
   const name=(popup?'Quick controls':'Full workspace')+(startupFailure?' initial connection recovery':' slider failure/retry');
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.addInitScript(({startupFailure})=>{
     const state={version:'0.1.2',enabled:false,ready:true,error:null,warning:null,previewUntil:null,values:{saturation:100,contrast:100,warmth:0,brightness:100,tint:0},profileId:'neutral',profiles:[],preferences:{startup:false,minimizeToTray:true},displays:[],popupPinned:false,experiencePrompts:false,workspaceVisible:true,experience:{tourDone:true,supportDue:false},updates:{status:'idle',available:null}};
     const listeners=[];window.auditMode='throw';window.auditCalls=0;window.auditPublish=()=>listeners.forEach(fn=>fn(structuredClone(state)));window.auditRecover=()=>{state.ready=true;state.error=null;window.auditPublish();};
     window.screenColor={subscribe(fn){listeners.push(fn);return()=>{};},async getState(){if(startupFailure)throw new Error('Initial connection failed');return structuredClone(state);},async action(type,payload){
      if(window.auditMode==='server'&&['values','toggle'].includes(type)){state.ready=false;state.error='Native unavailable';return {ok:false,error:state.error,state:structuredClone(state)};}if(type==='values'){window.auditCalls++;if(window.auditMode==='throw')throw new Error('Connection lost');if(window.auditMode==='reject')return {ok:false,error:'Disk full',state:structuredClone(state)};state.values=payload;state.enabled=true;}
      return {ok:true,state:structuredClone(state)};
     }};
    },{startupFailure});
    await page.goto(pathToFileURL(path.resolve(__dirname,'../out/ui',popup?'popup.html':'index.html')).href);
    const slider=page.locator(popup?'#quick-saturation':'#saturation'),toggle=page.locator(popup?'#quick-toggle':'#effect-toggle'),error=page.locator(popup?'#quick-error':'#error-banner');
    await slider.waitFor();
    if(startupFailure){
     await page.waitForFunction(()=>document.body.textContent.includes('Initial connection failed'));
     assert.equal(await toggle.isDisabled(),true,'Unavailable controls must be disabled after an initial IPC failure');
     const retry=page.locator(popup?'#quick-retry':'#retry');assert.equal(await retry.isVisible(),true);await retry.click();await page.waitForFunction(selector=>!document.querySelector(selector).disabled,popup?'#quick-toggle':'#effect-toggle');
     assert.equal(await error.isVisible(),false,'Successful retry clears the connection error');
    }else{
     await page.waitForFunction(selector=>!document.querySelector(selector).disabled,popup?'#quick-saturation':'#saturation');
     for(const mode of ['throw','reject']){
      await page.evaluate(mode=>window.auditMode=mode,mode);
      await slider.evaluate(input=>{input.value='145';input.dispatchEvent(new Event('input',{bubbles:true}));});
      await page.waitForFunction(()=>window.auditCalls>0);await page.evaluate(()=>window.auditPublish());
      assert.equal(await error.isVisible(),true,'Slider failures must survive the final render and subscription redraw');
      assert.match(await error.innerText(),mode==='throw'?/Connection lost/:/Disk full/);
      await page.evaluate(()=>window.auditMode='success');await slider.evaluate(input=>{input.value='150';input.dispatchEvent(new Event('input',{bubbles:true}));});
      await page.waitForFunction(selector=>document.querySelector(selector).getAttribute('aria-checked')==='true',popup?'#quick-toggle':'#effect-toggle');
      assert.equal(await error.isVisible(),false,'A successful slider retry clears the failure');
      await page.evaluate(()=>{window.auditCalls=0;});
     }
    }
    if(!startupFailure){for(const useToggle of [false,true]){await page.evaluate(()=>window.auditMode='server');if(useToggle)await toggle.click();else await slider.evaluate(input=>{input.value='155';input.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(selector=>document.querySelector(selector).disabled,popup?'#quick-toggle':'#effect-toggle');assert.match(await error.innerText(),/Native unavailable/);await page.evaluate(()=>window.auditRecover());assert.equal(await toggle.isEnabled(),true);assert.equal(await error.isVisible(),false,'Server-owned errors must clear when another window reconnects');}}
    assert.deepEqual(errors,[]);console.log('PASS: '+name);
   }catch(error){failures.push(name+': '+error.message);console.error('FAIL: '+name+': '+error.message);}finally{await page.close();}
  }
 }finally{await browser.close();}
 assert.deepEqual(failures,[]);
})().catch(error=>{console.error(error);process.exitCode=1;});
