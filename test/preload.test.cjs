const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {EventEmitter}=require('node:events');
function preload(response){
 const ipc=new EventEmitter();ipc.invoke=async()=>response;let api;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../out/electron/preload.cjs'),'utf8'),{require(name){assert.equal(name,'electron');return {ipcRenderer:ipc,contextBridge:{exposeInMainWorld(_name,value){api=value;}}};}});
 return {api,ipc};
}
test('the sandboxed preload rejects malformed state and action responses',async()=>{
 for(const value of [null,{},'bad',{ok:true,state:null}]){
  const {api}=preload(value);await assert.rejects(api.getState(),/Invalid app/);await assert.rejects(api.action('reset'),/Invalid app/);
 }
});
test('malformed IPC subscription data never reaches renderer listeners',()=>{
 const {api,ipc}=preload(null);let calls=0;const unsubscribe=api.subscribe(()=>calls++);
 ipc.emit('screen-color:update',{},null);ipc.emit('screen-color:update',{},{});assert.equal(calls,0);unsubscribe();
});
test('valid preload snapshots and failures survive validation and subscription cleanup',async()=>{
 const state={...require('../out/lib/model.cjs').defaultState(),version:'0.1.1',ready:true,error:null,warning:null,previewUntil:null,
  popupPinned:false,startupActual:false,startupWarning:null,shortcutAvailable:false,development:true,smoke:true,workspaceVisible:true,experiencePrompts:false,displays:[],
  experience:{version:1,launches:0,tourDone:false,supportDismissed:false,supportDue:false,notifiedVersion:null,dismissedVersion:null},
  updates:{current:'0.1.1',status:'idle',available:null,error:null,checkedAt:null}};
 const {api,ipc}=preload(state);assert.equal((await api.getState()).profileId,'neutral');let calls=0;
 const off=api.subscribe(next=>{assert.equal(next.enabled,false);calls++;});ipc.emit('screen-color:update',{},state);off();ipc.emit('screen-color:update',{},state);assert.equal(calls,1);
 const failed=preload({ok:false,error:'Disk full',state});const result=await failed.api.action('saveProfile','A look');assert.equal(result.ok,false);assert.equal(result.error,'Disk full');assert.equal(result.state.profileId,'neutral');
});
