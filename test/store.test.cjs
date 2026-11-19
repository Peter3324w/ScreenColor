const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {Store}=require('../out/lib/store.cjs');const {defaultState}=require('../out/lib/model.cjs');
test('store writes atomic roundtrips and malformed files load safely disabled',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'screen-color-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'settings.json'),store=new Store(file);assert.equal(store.load().state.enabled,false);
 const state=defaultState();state.enabled=true;state.profiles.push({id:'mine',name:'Wallpaper',values:state.values});store.save(state);
 assert.deepEqual(store.load().state,state);
 fs.writeFileSync(file,'{"enabled":true}');const damaged=store.load();assert.deepEqual(damaged.state,state);assert.match(damaged.warning,/backup/i);
 fs.writeFileSync(file+'.bak','broken backup');assert.equal(store.load().state.enabled,false);
 assert.throws(()=>store.save({...state,values:{}}));
});
test('settings and profile choice survive a fresh store after close/reopen and missing primary file',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'screen-color-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'settings.json');const state=defaultState();state.values.warmth=187;state.enabled=true;state.profiles=[{id:'saved-look',name:'My colors',values:{...state.values}}];state.profileId='saved-look';new Store(file).save(state);
 assert.deepEqual(new Store(file).load().state,state);fs.unlinkSync(file);assert.deepEqual(new Store(file).load().state,state);
});
