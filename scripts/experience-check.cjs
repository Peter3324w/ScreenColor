'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('../../Playtime/node_modules/playwright');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.local','experience');
require('./compile-app.cjs').compileApp();
(async()=>{fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  let experience=JSON.parse(localStorage.getItem('experience-test')||'null')||{launches:1,tourDone:false,supportDismissed:false,supportDue:false,notifiedVersion:null,dismissedVersion:null};
  let updates={current:'0.1.1',status:'idle',available:null,error:null};let state={ready:true,enabled:false,values:{saturation:100,contrast:100,warmth:0,brightness:100,tint:0},profileId:'neutral',profiles:[],preferences:{startup:false,minimizeToTray:true},displays:[],version:'0.1.1',workspaceVisible:true};const listeners=[];window.testActions=[];
  const snapshot=()=>({...state,experience:{...experience},updates:{...updates}});const emit=()=>listeners.forEach(fn=>fn(snapshot()));
  window.testSetExperience=patch=>{Object.assign(experience,patch);emit();};window.testSetUpdate=patch=>{Object.assign(updates,patch);emit();};window.testSetWorkspace=visible=>{state.workspaceVisible=visible;emit();};
  window.screenColor={getState:async()=>snapshot(),subscribe:fn=>{listeners.push(fn);return()=>{};},action:async(type,payload)=>{window.testActions.push({type,payload});if(window.testFailAction===type)return{ok:false,error:'Could not complete this action. Please try again.',state:snapshot()};if(type==='finishTour')experience.tourDone=true;if(type==='dismissSupport')experience.supportDismissed=true,experience.supportDue=false;if(type==='dismissUpdate')experience.dismissedVersion=updates.available.version;if(type==='checkUpdates')updates.status='error',updates.error='Could not check for updates. Check your connection and try again.';localStorage.setItem('experience-test',JSON.stringify(experience));emit();return{ok:true,state:snapshot()};}};
 });
 await page.goto(require('node:url').pathToFileURL(path.join(root,'out/ui/index.html')).href);await page.getByRole('dialog',{name:'Welcome to Screen Color'}).waitFor();
 await page.getByRole('button',{name:'Take the tour',exact:true}).click();
 const tour=page.getByRole('dialog',{name:'Interface tour'});await tour.waitFor();
 for(let i=0;i<9;i++){
  assert.equal(await tour.getAttribute('open'),'');
  const box=await tour.locator('.tour-panel').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=1281&&box.y+box.height<=901,'Tour callout fits viewport');
  await tour.getByRole('button',{name:i===8?'Done':'Next',exact:true}).click();
 }
 await tour.waitFor({state:'hidden'});await page.reload();assert.equal(await page.locator('dialog[open]').count(),0,'Tour completion persists');
 await page.click('.nav-item[data-view=settings]');await page.getByRole('button',{name:'Replay interface tour',exact:true}).click();await tour.waitFor();await page.keyboard.press('Escape');await tour.waitFor({state:'hidden'});
 const support=page.getByRole('dialog',{name:'Enjoying Screen Color?'});
 await page.evaluate(()=>{window.testSetWorkspace(false);window.testSetExperience({launches:4,supportDue:true,supportDismissed:false});});await page.waitForTimeout(250);assert.equal(await support.isVisible(),false,'No prompt while workspace is hidden');
 await page.click('.nav-item[data-view=adjustments]');await page.click('#save-profile');await page.evaluate(()=>window.testSetWorkspace(true));await page.waitForTimeout(250);assert.equal(await support.isVisible(),false,'A profile dialog takes priority');await page.click('#cancel-profile');
 await support.waitFor();assert.equal(await support.getByRole('button',{name:'Contribute to the PC fund',exact:true}).count(),1);assert.equal(await support.getByRole('button',{name:'Give feedback',exact:true}).count(),1);assert.equal(await support.getByRole('button',{name:'Browse more Cave apps',exact:true}).count(),1);
 const colors=await support.getByRole('button',{name:'Contribute to the PC fund',exact:true}).evaluate(el=>({bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));assert.notEqual(colors.bg,'rgb(255, 255, 255)');
 await page.screenshot({path:path.join(output,'support-desktop.png')});
 await page.evaluate(()=>window.testFailAction='openSupport');await support.getByRole('button',{name:'Give feedback',exact:true}).click();await support.getByRole('alert').waitFor();assert.equal(await support.isVisible(),true,'A failed external opening leaves a retry');assert.equal(await support.getByRole('button',{name:'Give feedback',exact:true}).isEnabled(),true);
 await page.evaluate(()=>window.testFailAction='dismissSupport');await support.getByRole('button',{name:'Give feedback',exact:true}).click();assert.equal(await support.isVisible(),true,'A failed dismissal save leaves the dialog open');
 await page.evaluate(()=>window.testFailAction=null);await support.getByRole('button',{name:'Give feedback',exact:true}).click();await support.waitFor({state:'hidden'});assert.ok((await page.evaluate(()=>window.testActions)).some(a=>a.type==='openSupport'&&a.payload==='feedback'));
 for(const [name,destination] of [['Contribute to the PC fund','help'],['Browse more Cave apps','apps']]){await page.evaluate(()=>window.testSetExperience({supportDue:true,supportDismissed:false}));await support.waitFor();await support.getByRole('button',{name,exact:true}).click();await support.waitFor({state:'hidden'});assert.ok((await page.evaluate(()=>window.testActions)).some(a=>a.type==='openSupport'&&a.payload===destination));}
 await page.reload();assert.equal(await page.locator('#support-dialog[open]').count(),0);
 await page.evaluate(()=>window.testSetUpdate({status:'available',available:{version:'0.2.0',size:82543707}}));const banner=page.locator('#update-banner');await banner.waitFor();await banner.getByRole('button',{name:'Download update',exact:true}).click();assert.ok((await page.evaluate(()=>window.testActions)).some(a=>a.type==='downloadUpdate'));
 await banner.getByRole('button',{name:'Dismiss update notification',exact:true}).click();await banner.waitFor({state:'hidden'});await page.click('.nav-item[data-view=settings]');assert.match(await page.locator('#update-status').innerText(),/0\.2\.0/);
 await page.getByRole('button',{name:'Check for updates',exact:true}).click();assert.match(await page.locator('#update-status').innerText(),/Could not check/);
 for(const [label,width,height] of [['desktop',1280,900],['narrow',760,680]]){await page.setViewportSize({width,height});await page.click('.nav-item[data-view=settings]');await page.screenshot({path:path.join(output,`after-${label}-settings.png`)});await page.getByRole('button',{name:'Replay interface tour',exact:true}).click();await tour.waitFor();await tour.getByRole('button',{name:'Next',exact:true}).click();await page.screenshot({path:path.join(output,`tour-${label}.png`)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.keyboard.press('Escape');await tour.waitFor({state:'hidden'});}
 assert.deepEqual(errors,[]);console.log('PASS: welcome, 9-step tour, skip/replay/persistence, fourth-launch support queue/hidden workspace/all three actions/color/failure recovery/dismissal, update download/dismiss/retry, desktop/narrow layout and no page errors.');
 }finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
