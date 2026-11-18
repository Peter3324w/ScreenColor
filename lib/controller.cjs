'use strict';
const {EventEmitter}=require('node:events');const {randomUUID}=require('node:crypto');const {validateValues,validateState,DEFAULT_VALUES,REFERENCE}=require('./model.cjs');
const FILTERS=require('../ui/filter-presets.js');
class Controller extends EventEmitter{
 constructor(bridge,store){super();this.bridge=bridge;this.store=store;const saved=store.load();this.state=structuredClone(saved.state);this.desiredEnabled=this.state.enabled;this.state.enabled=false;this.warning=saved.warning||null;this.error=null;this.ready=false;this.queue=Promise.resolve();this.previewMs=60000;this.previewTimer=null;this.previewUntil=null;this.previewGeneration=0;
  bridge.on('failure',error=>{this.clearPreview();this.ready=false;this.state.enabled=false;this.error=error.message;this.publish();});
 }
 snapshot(){return structuredClone({...this.state,ready:this.ready,error:this.error,warning:this.warning,previewUntil:this.previewUntil});}
 publish(){this.emit('state',this.snapshot());}
 async init(){try{await this.bridge.start();await this.bridge.request(this.desiredEnabled?{command:'apply',values:this.state.values}:{command:'reset'});this.ready=true;this.error=null;this.state.enabled=this.desiredEnabled;}catch(e){this.ready=false;this.state.enabled=false;this.error=e.message;}this.publish();return this.snapshot();}
 // Recheck timer ownership when queued work starts: an earlier native apply may have canceled it.
 dispatch(action,payload,previewGeneration){const run=this.queue.then(()=>previewGeneration!==undefined&&previewGeneration!==this.previewGeneration?this.snapshot():this.execute(action,payload));this.queue=run.catch(()=>{});return run;}
 clearPreview(){this.previewGeneration++;clearTimeout(this.previewTimer);this.previewTimer=null;this.previewUntil=null;}
 async execute(action,payload){
  if(action==='retry')return this.init();
  const next=structuredClone(this.state);let changeEffect=false,previewRestore;
  switch(action){
   case 'values':next.values=validateValues(payload);next.profileId=null;next.enabled=true;changeEffect=true;break;
   case 'toggle':if(typeof payload!=='boolean')throw new Error('Invalid effect toggle.');next.enabled=payload;changeEffect=true;break;
   case 'reset':next.values={...DEFAULT_VALUES};next.profileId='neutral';next.enabled=false;changeEffect=true;break;
   case 'preset':{const p=payload==='neutral'?DEFAULT_VALUES:payload==='reference'?REFERENCE:FILTERS.find(p=>p.id===payload)?.values||next.profiles.find(p=>p.id===payload)?.values;if(!p)throw new Error('Profile not found.');next.values={...p};next.profileId=payload;next.enabled=payload!=='neutral';changeEffect=true;break;}
   case 'saveProfile':{if(typeof payload!=='string'||!payload.trim()||payload.trim().length>64)throw new Error('Choose a profile name from 1 to 64 characters.');if(next.profiles.length>=100)throw new Error('You can save up to 100 profiles.');const p={id:randomUUID(),name:payload.trim(),values:{...next.values}};next.profiles.push(p);next.profileId=p.id;break;}
   case 'deleteProfile':{const index=next.profiles.findIndex(p=>p.id===payload);if(index<0)throw new Error('Built-in profiles cannot be deleted.');next.profiles.splice(index,1);if(next.profileId===payload)next.profileId=null;break;}
   case 'preferences':if(!payload||typeof payload.startup!=='boolean'||typeof payload.minimizeToTray!=='boolean')throw new Error('Invalid preferences.');next.preferences={startup:payload.startup,minimizeToTray:payload.minimizeToTray};break;
   case 'preview':previewRestore=this.previewUntil?this.previewRestore:this.desiredEnabled;next.enabled=true;changeEffect=true;break;
   case 'reapply':if(!this.state.enabled||!this.ready)return this.snapshot();changeEffect=true;break;
   default:throw new Error('Unknown action.');
  }
  validateState(next);
  try{
   if(changeEffect){if(!this.ready)throw new Error(this.error||'Color engine is unavailable. Close other color experiments, then retry.');await this.bridge.request(next.enabled?{command:'apply',values:next.values}:{command:'reset'});}
   // A timed preview is temporary; do not restore it as enabled after a crash/restart.
   const preservePreview=this.previewUntil&&['reapply','saveProfile','deleteProfile','preferences'].includes(action);
   const changesIntent=['values','toggle','reset','preset'].includes(action);const persisted={...next,enabled:action==='preview'?previewRestore:changesIntent?next.enabled:this.desiredEnabled};this.store.save(persisted);
   if(changesIntent)this.desiredEnabled=next.enabled;
   if(!preservePreview&&action!=='reapply')this.clearPreview();this.state=next;this.error=null;this.warning=null;
   if(action==='preview'){this.previewRestore=previewRestore;this.previewUntil=Date.now()+this.previewMs;const generation=this.previewGeneration;this.previewTimer=setTimeout(()=>this.dispatch('toggle',previewRestore,generation).catch(()=>{}),this.previewMs);}
   this.publish();return this.snapshot();
  }catch(e){
   if(changeEffect){this.clearPreview();try{await this.bridge.request({command:'reset'});}catch{}this.state.enabled=false;}
   this.error=e.message;this.publish();throw e;
  }
 }
 async close(){this.clearPreview();await this.queue;await this.bridge.close();}
}
module.exports={Controller};
