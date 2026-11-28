'use strict';
// Runs the real main/preload/renderers with the existing mocked-engine smoke mode.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {_electron}=require('../../Playtime/node_modules/playwright');
const {findRuntime}=require('./runtime.cjs');
const root=path.resolve(__dirname,'..'),captureRoot=path.join(root,'.local','experience-app');
require('./compile-app.cjs').compileApp();
(async()=>{
 fs.mkdirSync(path.join(captureRoot,'out','electron'),{recursive:true});
 for(const folder of ['ui','lib'])if(!fs.existsSync(path.join(captureRoot,'out',folder)))fs.symlinkSync(path.join(root,'out',folder),path.join(captureRoot,'out',folder),'junction');
 for(const file of ['preload.cjs','popup.cjs','smoke.cjs'])fs.copyFileSync(path.join(root,'out','electron',file),path.join(captureRoot,'out','electron',file));
 fs.copyFileSync(path.join(root,'package.json'),path.join(captureRoot,'package.json'));
 const main=fs.readFileSync(path.join(root,'out/electron/main.cjs'),'utf8');if(!/if\s*\(smoke\)\s*await runSmoke\(\);/.test(main))throw new Error('Smoke hook changed');
 fs.writeFileSync(path.join(captureRoot,'out/electron/main.cjs'),main.replace(/if\s*\(smoke\)\s*await runSmoke\(\);/,'if(smoke)log("Experience integration harness ready");'));
 const experienceFile=path.join(captureRoot,'.local','smoke-user','experience.json');fs.mkdirSync(path.dirname(experienceFile),{recursive:true});
 const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 // First opened yesterday: the next deliberate open is the later-day second open that makes support due.
 fs.writeFileSync(experienceFile,JSON.stringify({version:1,launches:1,tourDone:false,supportDismissed:false,notifiedVersion:null,dismissedVersion:null,firstOpenDay:day(new Date(Date.now()-86400000)),activeDays:0,lastActiveDay:null,supportNotified:false}));
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:findRuntime(),args:[captureRoot,'--smoke','--experience-test','--full-app'],env});
 try{
  await app.evaluate(({shell})=>{globalThis.testOpened=[];shell.openExternal=async url=>{globalThis.testOpened.push(url);};});
  let page;for(let attempt=0;attempt<100;attempt++){page=app.windows().find(window=>window.url().endsWith('/index.html'));if(page)break;await new Promise(resolve=>setTimeout(resolve,50));}assert.ok(page,'Full workspace loaded');page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('dialog',{name:'Welcome to Screen Color'}).waitFor();const initial=await page.evaluate(()=>window.screenColor.getState());assert.equal(initial.experience.launches,1,'Smoke must not add a launch');
  await page.getByRole('button',{name:'Take the tour',exact:true}).click();const tour=page.getByRole('dialog',{name:'Interface tour'});
  for(let i=0;i<9;i++)await tour.getByRole('button',{name:i===8?'Done':'Next',exact:true}).click();await tour.waitFor({state:'hidden'});
  const afterTour=await page.evaluate(()=>window.screenColor.getState());assert.equal(afterTour.experience.tourDone,true);assert.deepEqual(afterTour.values,initial.values);assert.equal(afterTour.enabled,initial.enabled,'Tour never changes desktop color intent');
  await page.locator('#sidebar-customise-button').click();await page.getByRole('button',{name:'Tips',exact:true}).click();const tips=page.locator('#view-tips'),replay=tips.getByRole('button',{name:'Replay interface tour',exact:true});assert.equal(await tips.locator('details').count(),8);await replay.click();await tour.waitFor();await tour.getByRole('button',{name:'Next',exact:true}).click();await page.keyboard.press('Escape');await tour.waitFor({state:'hidden'});assert.equal(await tips.isVisible(),true);assert.equal(await replay.evaluate(el=>el===document.activeElement),true);const afterTips=await page.evaluate(()=>window.screenColor.getState());assert.deepEqual(afterTips.values,initial.values);assert.equal(afterTips.enabled,initial.enabled,'Tips replay must preserve the effect');
  await app.evaluate(({app},captureRoot)=>app.emit('second-instance',{},[captureRoot,'--full-app']),captureRoot);
  assert.equal(JSON.parse(fs.readFileSync(experienceFile)).launches,2);const support=page.getByRole('dialog',{name:'Enjoying Screen Color?'});await page.waitForTimeout(600);assert.equal(await support.isVisible(),false,'Support never follows the welcome closely');
  await page.reload();await page.waitForSelector('#saturation');await support.waitFor();await page.keyboard.press('Escape');await support.waitFor({state:'hidden'});assert.equal(JSON.parse(fs.readFileSync(experienceFile)).supportDismissed,true);
  await app.evaluate(({app},captureRoot)=>app.emit('second-instance',{},[captureRoot,'--background']),captureRoot);await page.reload();await page.waitForSelector('#saturation');assert.equal(JSON.parse(fs.readFileSync(experienceFile)).launches,2);assert.equal(await page.locator('dialog[open]').count(),0);
  const checked=await page.evaluate(()=>window.screenColor.action('checkUpdates'));assert.equal(checked.ok,true);assert.equal(checked.state.updates.available.version,'1000.0.0');await page.locator('#update-banner').waitFor();
  await page.evaluate(()=>window.screenColor.action('downloadUpdate','https://evil.example'));const opened=await app.evaluate(()=>globalThis.testOpened);assert.deepEqual(opened,['https://github.com/Peter3324w/ScreenColor/releases/download/v1000.0.0/Screen-Color-Setup-1000.0.0-x64.exe']);
  await page.evaluate(()=>window.screenColor.action('openPopup'));const popup=app.windows().find(p=>p.url().endsWith('popup.html'));assert.ok(popup);await popup.locator('#quick-update').waitFor();assert.match(await popup.locator('#quick-update').innerText(),/1000\.0\.0/);await popup.locator('#quick-update').click();
  const invalid=await page.evaluate(()=>window.screenColor.action('openSupport','https://evil.example'));assert.equal(invalid.ok,false);const disabled=await page.evaluate(()=>window.screenColor.action('preferences',{startup:true,minimizeToTray:true}));assert.equal(disabled.ok,false,'Smoke must never change real startup');
  assert.deepEqual(errors,[]);console.log('PASS: real isolated Electron welcome/tour IPC and persistence, Tips replay/return/focus, unchanged colors, later-day second open with support held back after the welcome, background/reload exclusions, support dismissal, trusted release-only download and compact update notice. No native engine, installer download, real external links or real startup changes.');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
