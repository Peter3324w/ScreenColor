import fs = require('node:fs');
import path = require('node:path');
import { Store } from './store.cjs';
import { object } from './validation.cjs';
import type { ExperienceSnapshot } from '../shared/types';
// Screen Color mostly works from the tray, so "use" is counted two ways: opening
// the app yourself, and days the color effect was actually on. The support prompt
// waits for either a second open on a later day, or a week of active days.
type ExperienceState=Omit<ExperienceSnapshot,'supportDue'>&{firstOpenDay: string|null; activeDays: number; lastActiveDay: string|null; supportNotified: boolean};
export const SUPPORT_ACTIVE_DAYS=7;
const fresh=(): ExperienceState=>({version:1,launches:0,tourDone:false,supportDismissed:false,notifiedVersion:null,dismissedVersion:null,firstOpenDay:null,activeDays:0,lastActiveDay:null,supportNotified:false});
function version(value: unknown): value is string {
  return typeof value==='string'&&/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)&&value.split('.').every(n=>Number.isSafeInteger(Number(n)));
}
const day=(value: unknown): value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
const count=(value: unknown): value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=1000000;
export function dayKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function validate(value: unknown): ExperienceState {
  if(!object(value)||value.version!==1||!count(value.launches)||typeof value.tourDone!=='boolean'||typeof value.supportDismissed!=='boolean')throw new Error('Invalid experience state');
  if((value.notifiedVersion!==null&&!version(value.notifiedVersion))||(value.dismissedVersion!==null&&!version(value.dismissedVersion)))throw new Error('Invalid update version');
  // Fields added after 0.1.2 default when missing, so older files keep their counts.
  const firstOpenDay=value.firstOpenDay??null,lastActiveDay=value.lastActiveDay??null,activeDays=value.activeDays??0,supportNotified=value.supportNotified??false;
  if((firstOpenDay!==null&&!day(firstOpenDay))||(lastActiveDay!==null&&!day(lastActiveDay))||!count(activeDays)||typeof supportNotified!=='boolean')throw new Error('Invalid experience state');
  return {version:1,launches:value.launches,tourDone:value.tourDone,supportDismissed:value.supportDismissed,notifiedVersion:value.notifiedVersion,dismissedVersion:value.dismissedVersion,firstOpenDay,activeDays,lastActiveDay,supportNotified};
}
export class ExperienceStore {
  state=fresh();
  constructor(public file: string,public now: ()=>Date=()=>new Date()) {
    for(const source of [file,file+'.bak']){try{this.state=validate(JSON.parse(fs.readFileSync(source,'utf8')) as unknown);break;}catch{}}
  }
  atomicWrite(file: string,payload: string): void { Store.prototype.atomicWrite.call(this,file,payload); }
  supportDue(): boolean {
    const s=this.state;if(s.supportDismissed)return false;
    const laterOpen=s.launches>=2&&s.firstOpenDay!==dayKey(this.now());
    return laterOpen||s.activeDays>=SUPPORT_ACTIVE_DAYS;
  }
  // One Windows notification for people who never open the full app.
  supportNudgeDue(): boolean { return !this.state.supportDismissed&&!this.state.supportNotified&&this.state.activeDays>=SUPPORT_ACTIVE_DAYS; }
  snapshot(): ExperienceSnapshot {
    const s=this.state;
    return {version:1,launches:s.launches,tourDone:s.tourDone,supportDismissed:s.supportDismissed,notifiedVersion:s.notifiedVersion,dismissedVersion:s.dismissedVersion,supportDue:this.supportDue()};
  }
  change(patch: Partial<ExperienceState>): ExperienceSnapshot {
    const next=validate({...this.state,...patch});fs.mkdirSync(path.dirname(this.file),{recursive:true});const payload=JSON.stringify(next,null,2);
    this.atomicWrite(this.file,payload);this.state=next;try{this.atomicWrite(this.file+'.bak',payload);}catch{}return this.snapshot();
  }
  recordLaunch(background: boolean): ExperienceSnapshot {
    if(background)return this.snapshot();
    return this.change({launches:Math.min(1000000,this.state.launches+1),firstOpenDay:this.state.firstOpenDay??dayKey(this.now())});
  }
  // Called whenever the effect is on; writes at most once per calendar day.
  markActive(): ExperienceSnapshot {
    const today=dayKey(this.now());if(this.state.lastActiveDay===today)return this.snapshot();
    return this.change({activeDays:Math.min(1000000,this.state.activeDays+1),lastActiveDay:today});
  }
  finishTour(): ExperienceSnapshot { return this.change({tourDone:true}); }
  dismissSupport(): ExperienceSnapshot { return this.change({supportDismissed:true}); }
  markSupportNotified(): ExperienceSnapshot { return this.change({supportNotified:true}); }
  markNotified(value: unknown): ExperienceSnapshot { if(!version(value))throw new Error('Invalid update version');return this.change({notifiedVersion:value}); }
  dismissUpdate(value: unknown): ExperienceSnapshot { if(!version(value))throw new Error('Invalid update version');return this.change({dismissedVersion:value}); }
}
