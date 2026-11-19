import {query as $,all,message} from './dom';
import type {ColorValues,ColorControl,ScreenColorSnapshot,ActionArguments,Profile} from '../shared/types';
import {DEFAULT_VALUES as neutral,REFERENCE as reference} from '../lib/values.cjs';
import filters = require('../shared/filter-presets.cjs');
import {supportDestination} from '../lib/support.cjs';
import {createBrowserAPI,createInitialState} from './browser-api';
'use strict';
const definitions: {key: ColorControl;label: string;min: number;max: number;neutral: number;unit: string;help: string;ends: [string,string]}[]=[
 {key:'saturation',label:'Saturation',min:0,max:200,neutral:100,unit:'%',help:'Bring color intensity forward.',ends:['Muted','Vivid']},
 {key:'contrast',label:'Contrast',min:80,max:140,neutral:100,unit:'%',help:'Separate darker and brighter tones.',ends:['Softer','Deeper']},
 {key:'warmth',label:'Warmth',min:-300,max:300,neutral:0,unit:'',help:'Shift the balance between blue and warm tones.',ends:['Cooler','Warmer']},
 {key:'brightness',label:'Brightness',min:80,max:120,neutral:100,unit:'%',help:'Adjust picture brightness without changing the backlight.',ends:['Dimmer','Brighter']},
 {key:'tint',label:'Tint',min:-100,max:100,neutral:0,unit:'',help:'Balance a green or magenta color cast.',ends:['Greener','More magenta']}
];

let state: ScreenColorSnapshot={...createInitialState(),ready:false},draft: ColorValues={...neutral},pending: ColorValues|null=null,busy=false,savingProfile=false,currentView='adjustments',actionError: string|null=null;
const desktop=!!window.screenColor;
const api=window.screenColor||createBrowserAPI();
function setupControls(){
 for(const d of definitions){const row=document.createElement('div');row.className='control';row.dataset.key=d.key;
  const header=document.createElement('div');header.className='control-header';const label=document.createElement('label');label.htmlFor=d.key;label.textContent=d.label;
  const number=document.createElement('input');number.type='number';number.className='control-number';number.min=String(d.min);number.max=String(d.max);number.step=String(1);number.value=String(d.neutral);number.setAttribute('aria-label',d.label+' value');
  const unit=document.createElement('span');unit.className='unit';unit.textContent=d.unit;const reset=document.createElement('button');reset.className='control-reset';reset.dataset.icon='Refresh';reset.title='Reset '+d.label.toLowerCase();reset.setAttribute('aria-label',reset.title);
  header.append(label,number,unit,reset);const slider=document.createElement('input');slider.type='range';slider.id=d.key;slider.min=String(d.min);slider.max=String(d.max);slider.step=String(1);slider.value=String(d.neutral);
  const ends=document.createElement('div');ends.className='range-labels';for(const text of d.ends){const span=document.createElement('span');span.textContent=text;ends.append(span);}
  const help=document.createElement('p');help.className='control-description';help.textContent=d.help;
  function set(value: string|number){const n=Number(value);if(!Number.isFinite(n)||n<d.min||n>d.max)return;draft={...draft,[d.key]:n};number.value=String(n);slider.value=String(n);window.ImagePreview.update(draft,true,desktop);pending={...draft};flush();}
  slider.addEventListener('input',()=>set(slider.value));number.addEventListener('change',()=>{if(number.value===''||!number.checkValidity()){number.reportValidity();number.value=String(draft[d.key]);return;}set(number.value);});reset.addEventListener('click',()=>set(d.neutral));
  row.append(header,slider,ends,help);$('#controls').append(row);
 }
}
async function flush(){if(busy)return;busy=true;try{while(pending){const next=pending;pending=null;const response=await api.action('values',next);if(!response||!response.state)throw new Error('The app did not return its state. Please retry.');state=response.state;if(!response.ok){pending=null;showError(response.error);break;}actionError=null;render();}}catch(error){pending=null;showError(message(error));}finally{busy=false;if(state){draft={...state.values};render();}}}
async function action(...args: ActionArguments){
 // Drain live slider updates before a toggle/profile action so its final state wins.
 while(busy)await new Promise(resolve=>setTimeout(resolve,15));
 try{const response=await api.action(...args);if(!response||!response.state)throw new Error('The app did not return its state. Please retry.');state=response.state;if(!response.ok){draft={...state.values};render();showError(response.error);return false;}actionError=null;draft={...state.values};render();return true;}catch(error){showError(message(error));return false;}
}
function showError(message: string){actionError=state.error===message?null:message;$('#error-text').textContent=message;$('#error-banner').hidden=false;$('#saved-status').textContent='Change could not be applied';}
function render(){
 if(!state)return;if(!busy)draft={...state.values};
 for(const d of definitions){const row=$(`[data-key="${d.key}"]`);for(const input of row.querySelectorAll('input')){if(document.activeElement!==input)input.value=String(draft[d.key]);input.disabled=!state.ready;}$<HTMLButtonElement>('button',row).disabled=!state.ready;}
 $<HTMLButtonElement>('#effect-toggle').setAttribute('aria-checked',String(state.enabled));$<HTMLButtonElement>('#effect-toggle').disabled=!state.ready;$('#effect-text').textContent=state.enabled?'Effect on':'Effect off';
 const error=state.error||actionError;
 const connection=$('#connection');connection.replaceChildren();const dot=document.createElement('i');dot.className='status-dot'+(state.ready?' connected':'');connection.append(dot,document.createTextNode(!desktop?'Browser preview':state.smoke?'Interface smoke test':state.ready?'Color engine connected':error?'Color engine unavailable':'Connecting to color engine'));
 $('#error-banner').hidden=!error;if(error)$('#error-text').textContent=error;$<HTMLButtonElement>('#retry').hidden=state.ready;
 $('#warning-banner').hidden=!state.warning;if(state.warning)$('#warning-banner').textContent=state.warning;
 $('#profile-label').textContent=state.profileId==='reference'?'Custom preset one':state.profileId==='neutral'?'Default':filters.find(p=>p.id===state.profileId)?.name||state.profiles.find(p=>p.id===state.profileId)?.name||'Custom adjustments';
 $('#saved-status').textContent=!desktop?'Preview only · no desktop changes':error?'Change could not be applied':state.previewUntil?'Timed preview active':'Saved on this PC';
 $<HTMLButtonElement>('#reference').disabled=!state.ready;$<HTMLButtonElement>('#timed-preview').disabled=!state.ready||!desktop;$<HTMLButtonElement>('#reset-all').disabled=!state.ready;
 $<HTMLButtonElement>('#open-quick-controls').disabled=!desktop;$<HTMLButtonElement>('#open-quick-controls').title=desktop?'Open compact controls over your desktop':'Quick controls are available in the Electron app.';
 $<HTMLInputElement>('#startup').checked=state.startupActual||false;$<HTMLInputElement>('#startup').disabled=!desktop;$<HTMLInputElement>('#minimize').checked=state.preferences.minimizeToTray;$<HTMLInputElement>('#minimize').disabled=!desktop;
 $('#shortcut-description').textContent=state.shortcutAvailable?'Press the shortcut from any app to turn the effect off.':'Shortcut unavailable. Use the effect switch or the tray menu.';
 $('#display-info').textContent=state.displays?.length?state.displays.map(d=>`${d.name} · ${d.width} × ${d.height}`).join('\n'):'One look across your desktop';
 window.ImagePreview.update(draft,state.enabled,desktop);$<HTMLButtonElement>('#preview-original').disabled=!state.ready;$<HTMLButtonElement>('#preview-adjusted').disabled=!state.ready;
 renderFilters();renderProfiles();window.ScreenIcons.paint();
}
function setupFilters(){
 const ns='http://www.w3.org/2000/svg',defs=$<SVGDefsElement>('.preview-filter-definitions defs'),gallery=$('#filter-gallery');
 for(const preset of filters){
  const filter=document.createElementNS(ns,'filter');filter.id='sample-'+preset.id;filter.setAttribute('color-interpolation-filters','sRGB');
  const matrix=document.createElementNS(ns,'feColorMatrix');matrix.setAttribute('type','matrix');matrix.setAttribute('values',window.ColorPreview.svgMatrix(preset.values));filter.append(matrix);defs.append(filter);
  const card=document.createElement('button');card.type='button';card.className='filter-card';card.dataset.filter=preset.id;card.setAttribute('aria-label','Apply '+preset.name+' filter');card.setAttribute('aria-pressed','false');
  const sample=document.createElement('span');sample.className='filter-sample';const image=document.createElement('img');image.src=$<HTMLImageElement>('#preview-image').getAttribute('src')||'preview-default.jpg';image.alt='';image.loading='lazy';image.style.filter='url(#sample-'+preset.id+')';
  const badge=document.createElement('span');badge.className='filter-selected';badge.textContent='Selected';sample.append(image,badge);
  const copy=document.createElement('span');copy.className='filter-copy';const name=document.createElement('strong');name.textContent=preset.name;const description=document.createElement('span');description.textContent=preset.description;copy.append(name,description);card.append(sample,copy);
  card.addEventListener('click',()=>action('preset',preset.id));gallery.append(card);
  if(['filter-natural','filter-vivid','filter-golden','filter-cinema'].includes(preset.id)){const shortcut=card.cloneNode(true) as HTMLButtonElement;shortcut.addEventListener('click',()=>action('preset',preset.id));$('#adjustment-filter-gallery').append(shortcut);}
 }
 new MutationObserver(()=>{const source=$<HTMLImageElement>('#preview-image').getAttribute('src');for(const image of document.querySelectorAll<HTMLImageElement>('.filter-card img'))image.src=source||'preview-default.jpg';}).observe($<HTMLImageElement>('#preview-image'),{attributes:true,attributeFilter:['src']});
}
function renderFilters(){
 for(const hint of all('.filter-compare'))hint.hidden=!desktop||!state.enabled;for(const button of document.querySelectorAll<HTMLButtonElement>('[data-compare-filters]'))button.disabled=!state.ready;
 for(const card of document.querySelectorAll<HTMLButtonElement>('.filter-card')){card.disabled=!state.ready;card.setAttribute('aria-pressed',String(state.profileId===card.dataset.filter));}
}
function renderProfiles(){
 const container=$('#profile-list');container.replaceChildren();const profiles: (Profile & {builtin?: boolean})[]=[{id:'neutral',name:'Default',values:neutral,builtin:true},{id:'reference',name:'Custom preset one',values:reference,builtin:true},...state.profiles];
 for(const p of profiles){const row=document.createElement('article');row.className='profile-row';const swatch=document.createElement('span');swatch.className='profile-swatch '+p.id;
  const copy=document.createElement('div');copy.className='profile-copy';const title=document.createElement('strong');title.textContent=p.name;const summary=document.createElement('p');summary.textContent=`Saturation ${p.values.saturation}% · Contrast ${p.values.contrast}% · Warmth ${p.values.warmth}`;copy.append(title,summary);
  const apply=document.createElement('button');apply.className='quiet-button';apply.textContent=state.profileId===p.id?'Selected':'Apply';apply.disabled=!state.ready;apply.addEventListener('click',()=>action('preset',p.id));row.append(swatch,copy,apply);
  if(!p.builtin){const remove=document.createElement('button');remove.className='text-button';remove.dataset.icon='Trash';remove.title='Delete '+p.name;remove.setAttribute('aria-label','Delete '+p.name);remove.addEventListener('click',()=>action('deleteProfile',p.id));row.append(remove);}container.append(row);
 }
}
function showView(name?: string){if(!name)return;if(currentView!==name)$('main').scrollTop=0;currentView=name;for(const view of all('.view'))view.hidden=view.id!=='view-'+name;for(const button of all('.nav-item[data-view]')){const selected=button.dataset.view===name;button.classList.toggle('selected',selected);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}window.ScreenIcons.paint();}
setupControls();setupFilters();for(const button of all('[data-view]'))button.addEventListener('click',()=>showView(button.dataset.view));
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-support]'))button.addEventListener('click',async()=>{const error=$('#view-feedback').hidden?$('#sidebar-support-error'):$('#feedback-error');error.hidden=true;button.disabled=true;try{const result=await api.action('openSupport',supportDestination(button.dataset.support));if(!result||!result.state)throw new Error('The app did not return its state. Please retry.');if(!result.ok)throw new Error(result.error);}catch{error.textContent='Could not open your browser. Please try again.';error.hidden=false;}finally{button.disabled=false;}});
$<HTMLButtonElement>('#effect-toggle').addEventListener('click',()=>action('toggle',!state.enabled));$<HTMLButtonElement>('#reference').addEventListener('click',()=>action('preset','reference'));$<HTMLButtonElement>('#reset-all').addEventListener('click',()=>action('reset'));$<HTMLButtonElement>('#timed-preview').addEventListener('click',()=>action('preview'));$<HTMLButtonElement>('#retry').addEventListener('click',()=>action('retry'));
$<HTMLButtonElement>('#preview-original').addEventListener('click',()=>action('toggle',false));$<HTMLButtonElement>('#preview-adjusted').addEventListener('click',()=>action('toggle',true));
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-compare-filters]'))button.addEventListener('click',()=>action('toggle',false));
$<HTMLButtonElement>('#open-quick-controls').addEventListener('click',()=>action('openPopup'));
$<HTMLInputElement>('#startup').addEventListener('change',()=>action('preferences',{startup:$<HTMLInputElement>('#startup').checked,minimizeToTray:state.preferences.minimizeToTray}));$<HTMLInputElement>('#minimize').addEventListener('change',()=>action('preferences',{startup:state.startupActual||false,minimizeToTray:$<HTMLInputElement>('#minimize').checked}));$<HTMLButtonElement>('#quit').addEventListener('click',()=>action('quit'));
function openProfileDialog(){$('#profile-error').textContent='';$<HTMLInputElement>('#profile-name').value='';$<HTMLDialogElement>('#profile-dialog').showModal();$<HTMLInputElement>('#profile-name').focus();}
$<HTMLButtonElement>('#save-profile').addEventListener('click',openProfileDialog);$<HTMLButtonElement>('#save-profile-alt').addEventListener('click',openProfileDialog);$<HTMLButtonElement>('#cancel-profile').addEventListener('click',()=>$<HTMLDialogElement>('#profile-dialog').close());
$<HTMLFormElement>('#profile-form').addEventListener('submit',async event=>{event.preventDefault();if(savingProfile)return;savingProfile=true;const submit=$<HTMLButtonElement>('#profile-form button[type=submit]');submit.disabled=true;$('#profile-error').textContent='';try{if(await action('saveProfile',$<HTMLInputElement>('#profile-name').value))$<HTMLDialogElement>('#profile-dialog').close();else $('#profile-error').textContent='Could not save this profile. Check the message above.';}finally{savingProfile=false;submit.disabled=false;}});
$('#preview-notice').hidden=desktop;render();api.subscribe(next=>{state=next;render();});api.getState().then(next=>{state=next;actionError=null;render();}).catch(error=>{showError(message(error));render();});
setInterval(()=>{if(state?.previewUntil){const remaining=Math.max(0,Math.ceil((state.previewUntil-Date.now())/1000));$('#preview-description').textContent=`Timed preview · ${remaining}s remaining. Returns to the previous on/off state.`;}else $('#preview-description').textContent='Optional. Returns to the previous on/off state.';},500);
if(!desktop&&location.protocol==='http:'){const events=new EventSource('/events');events.onmessage=()=>location.reload();}
