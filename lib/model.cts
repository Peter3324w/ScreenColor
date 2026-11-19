import FILTERS = require('../shared/filter-presets.cjs');
import { colorMatrix } from '../shared/color-matrix';
import { DEFAULT_VALUES, validateValues } from './values.cjs';
import { object } from './validation.cjs';
import type { PersistedState, Profile } from '../shared/types';
export { LIMITS,DEFAULT_VALUES,REFERENCE,validateValues } from './values.cjs';

export function matrix(input: unknown): number[] { return colorMatrix(validateValues(input)); }
export function defaultState(): PersistedState {
  return {version:1,enabled:false,values:{...DEFAULT_VALUES},profileId:'neutral',profiles:[],preferences:{startup:false,minimizeToTray:true}};
}
export function validateState(input: unknown): PersistedState {
  if(!object(input)||input.version!==1||typeof input.enabled!=='boolean'||!Array.isArray(input.profiles)||input.profiles.length>100)throw new Error('Unsupported settings format.');
  if(!object(input.preferences)||typeof input.preferences.startup!=='boolean'||typeof input.preferences.minimizeToTray!=='boolean')throw new Error('Invalid preferences.');
  const ids=new Set(['neutral','reference',...FILTERS.map(p=>p.id)]);
  const profiles: Profile[]=input.profiles.map((p: unknown)=>{
    if(!object(p)||typeof p.id!=='string'||!p.id||p.id.length>80||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>64)throw new Error('Invalid saved profile.');
    ids.add(p.id);return {id:p.id,name:p.name.trim(),values:validateValues(p.values)};
  });
  if(input.profileId!==null&&(typeof input.profileId!=='string'||!ids.has(input.profileId)))throw new Error('Unknown selected profile.');
  return {version:1,enabled:input.enabled,values:validateValues(input.values),profileId:input.profileId,profiles,
    preferences:{startup:input.preferences.startup,minimizeToTray:input.preferences.minimizeToTray}};
}
