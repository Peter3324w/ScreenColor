import { defaultState } from '../lib/model.cjs';
import { DEFAULT_VALUES,REFERENCE,validateValues } from '../lib/values.cjs';
import filters = require('../shared/filter-presets.cjs');
import { supportURL } from '../lib/support.cjs';
import type { ScreenColorAPI,ScreenColorSnapshot } from '../shared/types';
export function createInitialState(): ScreenColorSnapshot {
  return {...defaultState(),version:'0.1.3',ready:true,error:null,warning:null,previewUntil:null,popupPinned:false,
    startupActual:false,startupWarning:null,shortcutAvailable:false,development:true,smoke:false,workspaceVisible:true,experiencePrompts:false,displays:[],
    experience:{version:1,launches:0,tourDone:false,supportDismissed:false,supportDue:false,notifiedVersion:null,dismissedVersion:null},
    updates:{current:'0.1.3',status:'idle',available:null,error:null,checkedAt:null}};
}
export function createBrowserAPI(): ScreenColorAPI {
  let state=createInitialState();
  return {
    async getState(){return structuredClone(state);},
    async action(...[type,payload]){
      if(type==='openSupport'){window.open(supportURL(payload),'_blank','noopener,noreferrer');return {ok:true,state:structuredClone(state)};}
      const next=structuredClone(state);
      if(type==='values'){next.values=validateValues(payload);next.enabled=true;next.profileId=null;}
      if(type==='preset'){
        const values=payload==='reference'?REFERENCE:payload==='neutral'?DEFAULT_VALUES:filters.find(p=>p.id===payload)?.values||next.profiles.find(p=>p.id===payload)?.values;
        if(!values)throw new Error('Profile not found.');next.values={...values};next.profileId=payload;next.enabled=payload!=='neutral';
      }
      if(type==='toggle')next.enabled=payload;
      if(type==='reset'){next.values={...DEFAULT_VALUES};next.enabled=false;next.profileId='neutral';}
      if(type==='saveProfile'){const p={id:String(Date.now()),name:payload,values:{...next.values}};next.profiles.push(p);next.profileId=p.id;}
      if(type==='deleteProfile'){next.profiles=next.profiles.filter(p=>p.id!==payload);if(next.profileId===payload)next.profileId=null;}
      state=next;return {ok:true,state:structuredClone(state)};
    },
    subscribe(){return ()=>{};}
  };
}
