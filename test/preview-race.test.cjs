const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {Controller}=require('../lib/controller.cjs');
const {defaultState}=require('../lib/model.cjs');

function setup(t){
 const bridge=new EventEmitter();
 bridge.start=async()=>{};
 bridge.close=async()=>{};
 bridge.request=async()=>{};
 const store={state:defaultState(),load(){return {state:this.state};},save(state){this.state=structuredClone(state);}};
 const controller=new Controller(bridge,store);
 t.after(()=>controller.close());
 return {controller,bridge,store};
}

async function holdNextAcknowledgment(bridge){
 let release,entered;
 const blocked=new Promise(resolve=>{release=resolve;});
 const started=new Promise(resolve=>{entered=resolve;});
 bridge.request=async()=>{entered();await blocked;};
 return {started,release};
}

test('an expired preview restore cannot disable a preset awaiting native acknowledgment',async t=>{
 const {controller,bridge,store}=setup(t);
 controller.previewMs=20;
 await controller.init();
 await controller.dispatch('preview');
 const gate=await holdNextAcknowledgment(bridge);
 const applying=controller.dispatch('preset','filter-vivid');
 await gate.started;
 // Let the old preview callback enqueue its restore behind the blocked preset.
 await new Promise(resolve=>setTimeout(resolve,60));
 gate.release();
 await applying;
 await controller.queue;
 assert.equal(controller.snapshot().profileId,'filter-vivid');
 assert.equal(controller.snapshot().enabled,true);
 assert.equal(store.state.enabled,true);
});

test('an expired preview restore cannot cancel a replacement preview awaiting acknowledgment',async t=>{
 const {controller,bridge,store}=setup(t);
 controller.previewMs=20;
 await controller.init();
 await controller.dispatch('preview');
 // The replacement preview should remain active well beyond the old deadline.
 controller.previewMs=1000;
 const gate=await holdNextAcknowledgment(bridge);
 const replacing=controller.dispatch('preview');
 await gate.started;
 await new Promise(resolve=>setTimeout(resolve,60));
 gate.release();
 await replacing;
 await controller.queue;
 assert.equal(controller.snapshot().enabled,true);
 assert.ok(controller.snapshot().previewUntil>Date.now());
 assert.equal(store.state.enabled,false,'temporary previews must still persist the original off state');
});
