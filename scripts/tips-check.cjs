'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('../../Playtime/node_modules/playwright');
const output=path.resolve(__dirname,'../.local/tips'),url=process.env.SCREEN_COLOR_PREVIEW_URL||'http://localhost:3000';
(async()=>{fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
 await page.goto(url);await page.locator('#controls .control').first().waitFor();
 const tipsNav=page.getByRole('button',{name:'Tips',exact:true});await tipsNav.click();
 const view=page.locator('#view-tips');await view.getByRole('heading',{name:'Tips & help'}).waitFor();assert.equal(await tipsNav.getAttribute('aria-current'),'page');
 assert.equal(await view.locator('details').count(),8);const first=view.locator('details').first(),summary=first.locator('summary');
 assert.equal(await first.getAttribute('open'),null);await summary.focus();await page.keyboard.press('Enter');assert.notEqual(await first.getAttribute('open'),null);await page.keyboard.press('Space');assert.equal(await first.getAttribute('open'),null);
 const values=await page.locator('#controls input').evaluateAll(inputs=>inputs.map(input=>input.value)),effect=await page.locator('#effect-toggle').getAttribute('aria-checked');
 const replay=view.getByRole('button',{name:'Replay interface tour',exact:true});await replay.click();const tour=page.getByRole('dialog',{name:'Interface tour'});await tour.waitFor();
 for(let step=0;step<9;step++)await tour.getByRole('button',{name:step===8?'Done':'Next',exact:true}).click();await tour.waitFor({state:'hidden'});
 assert.equal(await tipsNav.getAttribute('aria-current'),'page');assert.equal(await replay.evaluate(el=>el===document.activeElement),true,'Completion restores focus to the Tips replay button');
 assert.deepEqual(await page.locator('#controls input').evaluateAll(inputs=>inputs.map(input=>input.value)),values);assert.equal(await page.locator('#effect-toggle').getAttribute('aria-checked'),effect);
 await replay.click();await tour.waitFor();await tour.getByRole('button',{name:'Next',exact:true}).click();await page.keyboard.press('Escape');await tour.waitFor({state:'hidden'});assert.equal(await tipsNav.getAttribute('aria-current'),'page');assert.equal(await replay.evaluate(el=>el===document.activeElement),true);
 await page.click('.nav-item[data-view=settings]');await page.getByRole('button',{name:'Replay interface tour',exact:true}).click();await tour.waitFor();await page.keyboard.press('Escape');await tour.waitFor({state:'hidden'});assert.equal(await page.locator('.nav-item[data-view=settings]').getAttribute('aria-current'),'page');
 for(const [label,width,height] of [['desktop',1280,900],['narrow',760,680]]){
  await page.setViewportSize({width,height});await page.click('.nav-item[data-view=adjustments]');await page.screenshot({path:path.join(output,`after-${label}-adjustments.png`)});await tipsNav.click();
  await view.locator('details').first().locator('summary').click();await page.screenshot({path:path.join(output,`after-${label}-tips.png`)});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await view.evaluate(el=>el.scrollWidth<=el.clientWidth),true);await view.locator('details').first().locator('summary').click();
 }
 assert.deepEqual(errors,[]);console.log('PASS: Tips navigation, eight keyboard-accessible tips, nine-step replay and Escape return/focus, unchanged controls, Settings replay compatibility, desktop/narrow layout and no page errors.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
