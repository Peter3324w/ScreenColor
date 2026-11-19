import { validateState } from '../lib/model.cjs';
import { object } from '../lib/validation.cjs';
import type { ActionResult,AvailableUpdate,ScreenColorSnapshot,UpdateSnapshot } from './types';
const nullableString=(value: unknown): value is string|null=>value===null||typeof value==='string';
const nullableNumber=(value: unknown): value is number|null=>value===null||(typeof value==='number'&&Number.isFinite(value));
export function parseSnapshot(input: unknown): ScreenColorSnapshot {
  try{
    if(!object(input)||typeof input.version!=='string'||typeof input.ready!=='boolean'||!nullableString(input.error)||!nullableString(input.warning)||!nullableNumber(input.previewUntil))throw new Error();
    for(const key of ['popupPinned','startupActual','shortcutAvailable','development','smoke','workspaceVisible','experiencePrompts'])if(typeof input[key]!=='boolean')throw new Error();
    if(!nullableString(input.startupWarning)||!Array.isArray(input.displays))throw new Error();
    const displays=input.displays.map((display: unknown)=>{
      if(!object(display)||typeof display.id!=='number'||!Number.isFinite(display.id)||typeof display.name!=='string'||typeof display.width!=='number'||!Number.isFinite(display.width)||typeof display.height!=='number'||!Number.isFinite(display.height))throw new Error();
      return {id:display.id,name:display.name,width:display.width,height:display.height};
    });
    const experience=input.experience;
    if(!object(experience)||experience.version!==1||typeof experience.launches!=='number'||!Number.isSafeInteger(experience.launches)||experience.launches<0||typeof experience.tourDone!=='boolean'||typeof experience.supportDismissed!=='boolean'||typeof experience.supportDue!=='boolean'||!nullableString(experience.notifiedVersion)||!nullableString(experience.dismissedVersion))throw new Error();
    const updates=input.updates;
    if(!object(updates)||typeof updates.current!=='string'||typeof updates.status!=='string'||!['idle','checking','available','current','error'].includes(updates.status)||!nullableString(updates.error)||!nullableNumber(updates.checkedAt))throw new Error();
    let available: AvailableUpdate|null=null;
    if(updates.available!==null){const value=updates.available;if(!object(value)||typeof value.version!=='string'||typeof value.url!=='string'||typeof value.releaseURL!=='string'||typeof value.size!=='number'||!Number.isSafeInteger(value.size)||value.size<=0)throw new Error();available={version:value.version,url:value.url,releaseURL:value.releaseURL,size:value.size};}
    const state=validateState({...input,version:1});
    return {...state,version:input.version,ready:input.ready,error:input.error,warning:input.warning,previewUntil:input.previewUntil,
      popupPinned:input.popupPinned as boolean,startupActual:input.startupActual as boolean,startupWarning:input.startupWarning,
      shortcutAvailable:input.shortcutAvailable as boolean,development:input.development as boolean,smoke:input.smoke as boolean,
      workspaceVisible:input.workspaceVisible as boolean,experiencePrompts:input.experiencePrompts as boolean,displays,
      experience:{version:1,launches:experience.launches,tourDone:experience.tourDone,supportDismissed:experience.supportDismissed,supportDue:experience.supportDue,notifiedVersion:experience.notifiedVersion,dismissedVersion:experience.dismissedVersion},
      updates:{current:updates.current,status:updates.status as UpdateSnapshot['status'],error:updates.error,checkedAt:updates.checkedAt,available}};
  }catch{throw new Error('Invalid app state response.');}
}
export function parseActionResult(input: unknown): ActionResult {
  if(!object(input)||typeof input.ok!=='boolean'||(!input.ok&&typeof input.error!=='string'))throw new Error('Invalid app action response.');
  const state=parseSnapshot(input.state);return input.ok?{ok:true,state}:{ok:false,error:input.error as string,state};
}
