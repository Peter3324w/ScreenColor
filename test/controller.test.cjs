const {test}=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');
const {Controller}=require('../out/lib/controller.cjs');const {defaultState,REFERENCE}=require('../out/lib/model.cjs');
function setup(){const bridge=new EventEmitter();bridge.calls=[];bridge.request=async cmd=>{bridge.calls.push(cmd);if(bridge.fail)throw new Error('Native unavailable');return {ok:true};};bridge.start=async()=>{};bridge.close=async()=>{};const store={state:defaultState(),load(){return {state:this.state};},save(s){this.state=structuredClone(s);}};return {bridge,store,c:new Controller(bridge,store)};}
test('settings apply only after acknowledgment and failures disable the reported effect',async()=>{
 const {c,bridge}=setup();await c.init();await c.dispatch('values',REFERENCE);assert.equal(c.snapshot().enabled,true);assert.deepEqual(c.snapshot().values,REFERENCE);
 bridge.fail=true;await assert.rejects(c.dispatch('values',{...REFERENCE,saturation:150}));assert.equal(c.snapshot().enabled,false);assert.match(c.snapshot().error,/Native unavailable/);await c.close();
});
test('presets and named profiles persist, protected presets cannot be deleted',async()=>{
 const {c,store}=setup();await c.init();await c.dispatch('preset','reference');await c.dispatch('saveProfile','My wallpaper');const id=c.snapshot().profileId;
 assert.equal(store.state.profiles[0].name,'My wallpaper');await c.dispatch('preset','neutral');await c.dispatch('preset',id);assert.deepEqual(c.snapshot().values,REFERENCE);
 await assert.rejects(c.dispatch('deleteProfile','reference'));await c.dispatch('deleteProfile',id);assert.equal(c.snapshot().profiles.length,0);await c.close();
});
test('effect toggle preserves sliders; updates serialize and settings failure resets native',async()=>{
 const {c,bridge,store}=setup();await c.init();await Promise.all([c.dispatch('values',REFERENCE),c.dispatch('toggle',false)]);assert.equal(c.snapshot().enabled,false);assert.deepEqual(c.snapshot().values,REFERENCE);assert.equal(bridge.calls.at(-1).command,'reset');
 store.save=()=>{throw new Error('Disk full');};await assert.rejects(c.dispatch('toggle',true));assert.equal(c.snapshot().enabled,false);assert.equal(bridge.calls.at(-1).command,'reset');await c.close();
});
test('preview timeout restores previous enabled state and user action cancels timeout',async()=>{
 const {c}=setup();c.previewMs=25;await c.init();await c.dispatch('preview');assert.equal(c.snapshot().enabled,true);await new Promise(r=>setTimeout(r,65));assert.equal(c.snapshot().enabled,false);
 await c.dispatch('preview');await c.dispatch('values',REFERENCE);await new Promise(r=>setTimeout(r,65));assert.equal(c.snapshot().enabled,true);await c.close();
});
test('display reapply and profile saves preserve a temporary preview and its persisted off state',async()=>{
 const {c,store}=setup();c.previewMs=40;await c.init();await c.dispatch('preview');await c.dispatch('reapply');
 assert.equal(store.state.enabled,false);assert.ok(c.previewUntil);
 await c.dispatch('saveProfile','While previewing');assert.equal(store.state.enabled,false);assert.ok(c.previewUntil);
 await new Promise(r=>setTimeout(r,90));assert.equal(c.snapshot().enabled,false);await c.close();
});
test('temporary engine failures preserve the desired effect through profile saves and reconnect',async()=>{
 const {c,bridge,store}=setup();await c.init();await c.dispatch('values',REFERENCE);bridge.emit('failure',new Error('Display reconnecting'));assert.equal(c.snapshot().enabled,false);
 await c.dispatch('saveProfile','Keep my colors');assert.equal(store.state.enabled,true);await c.dispatch('retry');assert.equal(c.snapshot().enabled,true);assert.deepEqual(bridge.calls.at(-1),{command:'apply',values:REFERENCE});await c.close();
});
