const {test}=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');
const filters=require('../out/shared/filter-presets.cjs');
const {Controller}=require('../out/lib/controller.cjs');const {defaultState,validateValues,validateState,REFERENCE}=require('../out/lib/model.cjs');
function setup(){const bridge=new EventEmitter();bridge.calls=[];bridge.start=async()=>{};bridge.close=async()=>{};bridge.request=async cmd=>{if(bridge.fail)throw new Error('Display unavailable');bridge.calls.push(cmd);};const store={state:defaultState(),load(){return {state:structuredClone(this.state)};},save(state){this.state=structuredClone(state);}};return {bridge,store,c:new Controller(bridge,store)};}
test('starter filters have unique immutable IDs and complete values within existing control limits',()=>{
 assert.equal(filters.length,8);assert.equal(new Set(filters.map(p=>p.id)).size,filters.length);
 for(const p of filters){assert.match(p.id,/^filter-/);assert.ok(p.name&&p.description);assert.deepEqual(validateValues(p.values),p.values);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.values));}
 assert.ok(Object.isFrozen(filters));assert.deepEqual(REFERENCE,{saturation:139,contrast:115,warmth:100,brightness:100,tint:0});
});
test('each filter applies through the native bridge and survives a fresh controller without consuming saved profiles',async()=>{
 const {c,store,bridge}=setup();await c.init();for(const p of filters){await c.dispatch('preset',p.id);assert.deepEqual(bridge.calls.at(-1),{command:'apply',values:p.values});assert.equal(store.state.profileId,p.id);assert.equal(store.state.profiles.length,0);const reopened=new Controller(bridge,store);await reopened.init();assert.equal(reopened.snapshot().profileId,p.id);assert.deepEqual(reopened.snapshot().values,p.values);await reopened.close();}await c.close();
});
test('built-in filters cannot be deleted or shadowed by saved profiles; unknown presets are rejected',async()=>{
 const {c}=setup();await c.init();for(const p of filters){await assert.rejects(c.dispatch('deleteProfile',p.id),/Built-in/);assert.throws(()=>validateState({...defaultState(),profiles:[{id:p.id,name:'Shadow',values:p.values}]}),/Invalid saved profile/);}await assert.rejects(c.dispatch('preset','filter-missing'),/not found/);await c.close();
});
test('fine-tuning clears the built-in selection and saving creates a personal copy',async()=>{
 const {c}=setup();await c.init();const p=filters[0];await c.dispatch('preset',p.id);const adjusted={...p.values,warmth:25};await c.dispatch('values',adjusted);assert.equal(c.snapshot().profileId,null);await c.dispatch('saveProfile','My Natural');assert.deepEqual(c.snapshot().profiles[0].values,adjusted);assert.notEqual(c.snapshot().profileId,p.id);assert.notEqual(p.values.warmth,25);await c.close();
});
test('a failed native filter apply preserves the previous selected values and disk state',async()=>{
 const {c,store,bridge}=setup();await c.init();const before=structuredClone(store.state);bridge.fail=true;await assert.rejects(c.dispatch('preset',filters[0].id),/Display unavailable/);assert.deepEqual(store.state,before);assert.equal(c.snapshot().profileId,'neutral');assert.equal(c.snapshot().enabled,false);await c.close();
});
