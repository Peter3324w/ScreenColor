'use strict';
const fs=require('node:fs');const path=require('node:path');
const {chromium}=require(path.resolve(__dirname,'..','..','Playtime','node_modules','playwright'));
const output=path.resolve(__dirname,'..','.local');fs.mkdirSync(output,{recursive:true});const report={ok:false,checks:[],errors:[]};
function record(message){report.checks.push(message);fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify(report,null,2));console.log(message);}
process.on('exit',code=>{if(!report.ok){fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify({...report,exitCode:code,limitation:'Browser verification did not finish.'},null,2));process.exitCode=1;}});
(async()=>{
 record('Browser verification started');
 const browser=await chromium.launch({executablePath:chromium.executablePath(),headless:true,chromiumSandbox:true});record('Cached Chromium launched');
 try{
  const page=await browser.newPage({viewport:{width:1020,height:820}});page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(process.env.SCREEN_COLOR_PREVIEW_URL||'http://localhost:3000');await page.waitForSelector('#controls input[type=range]');record('UI and five color controls loaded');
  if(await page.locator('#controls input[type=range]').count()!==5)throw new Error('Expected five controls');
  await page.click('#reference');await page.waitForFunction(()=>document.querySelector('#saturation').value==='139');record('Reference preset updates controls');
  await page.click('[data-view=profiles]');await page.click('#save-profile-alt');await page.fill('#profile-name','Wallpaper look');await page.click('#profile-form button[type=submit]');await page.waitForSelector('#profile-dialog:not([open])');if(!await page.getByText('Wallpaper look',{exact:true}).count())throw new Error('Profile missing');record('Profile dialog and named profile work');
  await page.click('[data-view=settings]');if(!await page.locator('#startup').isDisabled())throw new Error('Browser preview must not change startup');record('Browser preview cannot change Windows startup');
  await page.click('[data-view=adjustments]');await page.screenshot({path:path.join(output,'browser-preview.png'),fullPage:true});record('1020px UI screenshot captured');
  await page.setViewportSize({width:760,height:680});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Horizontal overflow');record('760px layout has no horizontal overflow');
  if(report.errors.length)throw new Error(report.errors.join('\n'));report.ok=true;fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{report.errors.push(error.stack);fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;});
