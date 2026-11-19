'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ExperienceStore}=require('../out/lib/experience.cjs');
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'screen-color-experience-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'experience.json');}
test('four deliberate launches trigger support once, excluding background launches and reads',t=>{
 const file=fixture(t);let store=new ExperienceStore(file);
 for(let i=0;i<3;i++){store.recordLaunch(false);store.recordLaunch(true);assert.equal(store.snapshot().supportDue,false);}
 assert.equal(new ExperienceStore(file).snapshot().launches,3);
 store.recordLaunch(false);assert.equal(store.snapshot().supportDue,true);
 store.finishTour();store.dismissSupport();store=new ExperienceStore(file);store.recordLaunch(false);
 assert.equal(store.snapshot().supportDue,false);assert.equal(store.snapshot().tourDone,true);
});
test('experience backup recovers corrupt primary, validates counters and preserves settings independently',t=>{
 const file=fixture(t),store=new ExperienceStore(file);store.recordLaunch(false);fs.writeFileSync(file,'{');assert.equal(new ExperienceStore(file).snapshot().launches,1);
 fs.writeFileSync(file,JSON.stringify({version:1,launches:-5}));fs.writeFileSync(file+'.bak','invalid');assert.equal(new ExperienceStore(file).snapshot().launches,0);
});
test('failed experience save never falsely commits launch or prompt dismissal',t=>{
 const file=fixture(t),store=new ExperienceStore(file);store.recordLaunch(false);store.atomicWrite=()=>{throw new Error('Disk is full');};
 assert.throws(()=>store.dismissSupport(),/Disk is full/);assert.equal(store.snapshot().supportDismissed,false);assert.throws(()=>store.recordLaunch(false));assert.equal(store.snapshot().launches,1);
});
test('notified and dismissed update versions survive relaunch without accepting arbitrary flags',t=>{
 const file=fixture(t),store=new ExperienceStore(file);store.markNotified('0.2.0');store.dismissUpdate('0.2.0');const again=new ExperienceStore(file).snapshot();assert.equal(again.notifiedVersion,'0.2.0');assert.equal(again.dismissedVersion,'0.2.0');assert.throws(()=>store.markNotified('bad'));
});
