'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ExperienceStore}=require('../out/lib/experience.cjs');
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'screen-color-experience-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'experience.json');}
const at=(text)=>()=>new Date(text+'T12:00:00');
test('support waits for a second open on a later day, never counting background launches',t=>{
 const file=fixture(t);let store=new ExperienceStore(file,at('2026-11-20'));
 store.recordLaunch(false);store.recordLaunch(true);assert.equal(store.snapshot().supportDue,false);
 store.recordLaunch(false);assert.equal(store.snapshot().supportDue,false,'two opens on the first day are not enough');
 store=new ExperienceStore(file,at('2026-11-21'));assert.equal(store.snapshot().launches,2);assert.equal(store.snapshot().supportDue,true);
 store.finishTour();store.dismissSupport();store=new ExperienceStore(file,at('2026-11-30'));store.recordLaunch(false);
 assert.equal(store.snapshot().supportDue,false);assert.equal(store.snapshot().tourDone,true);
});
test('a week of active days makes support due and nudges once, for tray-only use',t=>{
 const file=fixture(t);let store=new ExperienceStore(file,at('2026-11-01'));
 for(let d=1;d<=6;d++){store.now=at(`2026-11-0${d}`);store.markActive();store.markActive();}
 assert.equal(store.snapshot().supportDue,false);assert.equal(store.supportNudgeDue(),false);
 store.now=at('2026-11-07');store.markActive();assert.equal(store.state.activeDays,7);
 assert.equal(store.snapshot().supportDue,true);assert.equal(store.supportNudgeDue(),true);
 store.markSupportNotified();store=new ExperienceStore(file,at('2026-11-08'));assert.equal(store.supportNudgeDue(),false);assert.equal(store.snapshot().supportDue,true);
 store.dismissSupport();assert.equal(store.snapshot().supportDue,false);
});
test('experience files from 0.1.2 load with the new counters defaulted',t=>{
 const file=fixture(t);fs.writeFileSync(file,JSON.stringify({version:1,launches:5,tourDone:true,supportDismissed:false,notifiedVersion:null,dismissedVersion:null}));
 const store=new ExperienceStore(file,at('2026-11-27'));assert.equal(store.snapshot().launches,5);assert.equal(store.state.activeDays,0);assert.equal(store.snapshot().supportDue,true);
 assert.deepEqual(Object.keys(store.snapshot()).sort(),['dismissedVersion','launches','notifiedVersion','supportDismissed','supportDue','tourDone','version']);
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
