'use strict';
const FILTERS=require('../ui/filter-presets.js');
const {LIMITS,DEFAULT_VALUES,REFERENCE,validateValues}=require('./values.cjs');
function object(value){return value!==null && typeof value==='object' && !Array.isArray(value);}
function matrix(input){
 return require('../ui/color-matrix.js').colorMatrix(validateValues(input));
}
function defaultState(){return {version:1,enabled:false,values:{...DEFAULT_VALUES},profileId:'neutral',profiles:[],preferences:{startup:false,minimizeToTray:true}};}
function validateState(input){
 if(!object(input)||input.version!==1||typeof input.enabled!=='boolean'||!Array.isArray(input.profiles)||input.profiles.length>100)throw new Error('Unsupported settings format.');
 if(!object(input.preferences)||typeof input.preferences.startup!=='boolean'||typeof input.preferences.minimizeToTray!=='boolean')throw new Error('Invalid preferences.');
 const ids=new Set(['neutral','reference',...FILTERS.map(p=>p.id)]);const profiles=input.profiles.map(p=>{
  if(!object(p)||typeof p.id!=='string'||!p.id||p.id.length>80||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>64)throw new Error('Invalid saved profile.');
  ids.add(p.id);return {id:p.id,name:p.name.trim(),values:validateValues(p.values)};
 });
 if(input.profileId!==null && !ids.has(input.profileId))throw new Error('Unknown selected profile.');
 return {version:1,enabled:input.enabled,values:validateValues(input.values),profileId:input.profileId,profiles,preferences:{startup:input.preferences.startup,minimizeToTray:input.preferences.minimizeToTray}};
}
module.exports={LIMITS,DEFAULT_VALUES,REFERENCE,validateValues,matrix,defaultState,validateState};
