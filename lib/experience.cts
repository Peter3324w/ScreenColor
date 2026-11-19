import fs = require('node:fs');
import path = require('node:path');
import { Store } from './store.cjs';
import { object } from './validation.cjs';
import type { ExperienceSnapshot } from '../shared/types';
type ExperienceState=Omit<ExperienceSnapshot,'supportDue'>;
const fresh=(): ExperienceState=>({version:1,launches:0,tourDone:false,supportDismissed:false,notifiedVersion:null,dismissedVersion:null});
function version(value: unknown): value is string {
  return typeof value==='string'&&/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)&&value.split('.').every(n=>Number.isSafeInteger(Number(n)));
}
function validate(value: unknown): ExperienceState {
  if(!object(value)||value.version!==1||typeof value.launches!=='number'||!Number.isSafeInteger(value.launches)||value.launches<0||value.launches>1000000||typeof value.tourDone!=='boolean'||typeof value.supportDismissed!=='boolean')throw new Error('Invalid experience state');
  if((value.notifiedVersion!==null&&!version(value.notifiedVersion))||(value.dismissedVersion!==null&&!version(value.dismissedVersion)))throw new Error('Invalid update version');
  return {version:1,launches:value.launches,tourDone:value.tourDone,supportDismissed:value.supportDismissed,notifiedVersion:value.notifiedVersion,dismissedVersion:value.dismissedVersion};
}
export class ExperienceStore {
  state=fresh();
  constructor(public file: string) {
    for(const source of [file,file+'.bak']){try{this.state=validate(JSON.parse(fs.readFileSync(source,'utf8')) as unknown);break;}catch{}}
  }
  atomicWrite(file: string,payload: string): void { Store.prototype.atomicWrite.call(this,file,payload); }
  snapshot(): ExperienceSnapshot { return {...this.state,supportDue:this.state.launches>=4&&!this.state.supportDismissed}; }
  change(patch: Partial<ExperienceState>): ExperienceSnapshot {
    const next=validate({...this.state,...patch});fs.mkdirSync(path.dirname(this.file),{recursive:true});const payload=JSON.stringify(next,null,2);
    this.atomicWrite(this.file,payload);this.state=next;try{this.atomicWrite(this.file+'.bak',payload);}catch{}return this.snapshot();
  }
  recordLaunch(background: boolean): ExperienceSnapshot { return background?this.snapshot():this.change({launches:Math.min(1000000,this.state.launches+1)}); }
  finishTour(): ExperienceSnapshot { return this.change({tourDone:true}); }
  dismissSupport(): ExperienceSnapshot { return this.change({supportDismissed:true}); }
  markNotified(value: unknown): ExperienceSnapshot { if(!version(value))throw new Error('Invalid update version');return this.change({notifiedVersion:value}); }
  dismissUpdate(value: unknown): ExperienceSnapshot { if(!version(value))throw new Error('Invalid update version');return this.change({dismissedVersion:value}); }
}
