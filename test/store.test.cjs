const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {Store}=require('../lib/store.cjs');const {defaultState}=require('../lib/model.cjs');
test('store writes atomic roundtrips and malformed files load safely disabled',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'screen-color-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'settings.json'),store=new Store(file);assert.equal(store.load().state.enabled,false);
 const state=defaultState();state.enabled=true;state.profiles.push({id:'mine',name:'Wallpaper',values:state.values});store.save(state);
 assert.deepEqual(store.load().state,state);assert.equal(fs.readdirSync(dir).length,1);
 fs.writeFileSync(file,'{"enabled":true}');const damaged=store.load();assert.equal(damaged.state.enabled,false);assert.match(damaged.warning,/settings/i);
 assert.throws(()=>store.save({...state,values:{}}));
});
