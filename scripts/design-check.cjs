'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {chromium}=require('../..//Playtime/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:chromium.executablePath(),headless:true,chromiumSandbox:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3000');await page.click('#reference');
  assert.equal(await page.locator('.nav-item.selected [data-painted="Setting4Bulk"] svg').count(),1);
  assert.equal(await page.locator('[data-icon]:not([data-painted])').count(),0);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(0, 0, 0)');
  assert.equal(await page.locator('.nav-item.selected').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
  assert.equal(await page.locator('.nav-item.selected').evaluate(el=>getComputedStyle(el).color),'rgb(0, 0, 0)');
  await page.screenshot({path:'.local/playtime-after.png',fullPage:true});
  await page.evaluate(()=>scrollTo(0,500));assert.ok(Math.abs((await page.locator('.image-preview').boundingBox()).y-12)<1);
  await page.click('[data-view=settings]');assert.equal(await page.locator('#theme-picker button').count(),5);
  const palettes={midnight:'rgb(0, 0, 0)',graphite:'rgb(10, 9, 8)',deep:'rgb(7, 10, 18)',moss:'rgb(6, 11, 7)',rose:'rgb(11, 7, 9)'};
  for(const [theme,color] of Object.entries(palettes)){await page.click(`#theme-picker [data-theme="${theme}"]`);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),color);}
  await page.click('#theme-picker [data-theme="deep"]');await page.fill('#accent-hex','#c472ed');await page.locator('#accent-hex').dispatchEvent('change');await page.reload();await page.click('[data-view=settings]');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'deep');assert.equal(await page.evaluate(()=>document.documentElement.dataset.accent),'#c472ed');
  await page.fill('#accent-hex','invalid');await page.locator('#accent-hex').dispatchEvent('change');assert.equal(await page.evaluate(()=>document.documentElement.dataset.accent),'#c472ed');
  await page.click('#accent-auto');assert.equal(await page.evaluate(()=>document.documentElement.dataset.accent),undefined);
  await page.click('#theme-picker [data-theme="midnight"]');await page.screenshot({path:'.local/playtime-settings.png',fullPage:true});
  await page.setViewportSize({width:760,height:680});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.click('[data-view=adjustments]');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.evaluate(()=>scrollTo(0,500));assert.ok(Math.abs((await page.locator('.image-preview').boundingBox()).y-12)<1);
  assert.deepEqual(errors,[]);const report={ok:true,checks:['PlayTime Midnight tokens','white selected nav with black text','Iconsax Linear/Bulk SVGs','five exact theme palettes','custom accent persistence and validation','Auto accent reset','sticky preview','760px adjustments/settings without overflow','no page errors']};fs.writeFileSync(path.join(__dirname,'../.local/design-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
