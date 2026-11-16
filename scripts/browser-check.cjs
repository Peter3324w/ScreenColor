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
  await page.waitForFunction(()=>document.querySelector('#preview-image')?.naturalWidth>0);await page.click('#preview-original');
  const original=await page.locator('#preview-image').screenshot();await page.click('#preview-adjusted');await page.waitForFunction(()=>document.querySelector('#preview-image').classList.contains('simulate-preview'));
  const adjusted=await page.locator('#preview-image').screenshot();if(original.equals(adjusted))throw new Error('Image preview did not visibly change');record('Original and adjusted image previews render differently');
  await page.locator('#saturation').evaluate(input=>{input.value=170;input.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>document.querySelector('#saturation').value==='170');const stronger=await page.locator('#preview-image').screenshot();if(stronger.equals(adjusted))throw new Error('Slider did not change the image');record('Slider updates the image live');
  await page.locator('#preview-file').setInputFiles(path.join(output,'preview-before.png'));await page.waitForFunction(()=>document.querySelector('#preview-image-name').textContent==='preview-before.png');
  await page.waitForFunction(()=>document.querySelector('#preview-image').src.startsWith('data:'));await page.waitForTimeout(150);await page.reload();await page.waitForFunction(()=>document.querySelector('#preview-image-name').textContent==='preview-before.png');record('Chosen local image persists through reload');
  await page.click('#default-image');await page.waitForFunction(()=>document.querySelector('#preview-image-name').textContent==='Your wallpaper');await page.click('#reference');record('Default wallpaper can be restored');
  await page.click('[data-view=profiles]');await page.click('#save-profile-alt');await page.fill('#profile-name','Wallpaper look');await page.click('#profile-form button[type=submit]');await page.waitForFunction(()=>!document.querySelector('#profile-dialog').open);if(!await page.getByText('Wallpaper look',{exact:true}).count())throw new Error('Profile missing');record('Profile dialog and named profile work');
  await page.click('[data-view=settings]');if(!await page.locator('#startup').isDisabled())throw new Error('Browser preview must not change startup');record('Browser preview cannot change Windows startup');
  await page.click('[data-view=adjustments]');await page.screenshot({path:path.join(output,'browser-preview.png'),fullPage:true});record('1020px UI screenshot captured');
  await page.setViewportSize({width:760,height:680});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Horizontal overflow');record('760px layout has no horizontal overflow');
  if(report.errors.length)throw new Error(report.errors.join('\n'));report.ok=true;fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{report.errors.push(error.stack);fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;});
