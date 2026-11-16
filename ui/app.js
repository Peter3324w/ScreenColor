'use strict';
const definitions=[
 {key:'saturation',label:'Saturation',min:0,max:200,neutral:100,unit:'%',help:'Bring color intensity forward.',ends:['Muted','Vivid']},
 {key:'contrast',label:'Contrast',min:80,max:140,neutral:100,unit:'%',help:'Separate darker and brighter tones.',ends:['Softer','Deeper']},
 {key:'warmth',label:'Warmth',min:-300,max:300,neutral:0,unit:'',help:'Shift the balance between blue and warm tones.',ends:['Cooler','Warmer']},
 {key:'brightness',label:'Brightness',min:80,max:120,neutral:100,unit:'%',help:'Adjust picture brightness without changing the backlight.',ends:['Dimmer','Brighter']},
 {key:'tint',label:'Tint',min:-100,max:100,neutral:0,unit:'',help:'Balance a green or magenta color cast.',ends:['Greener','More magenta']}
];
const neutral={saturation:100,contrast:100,warmth:0,brightness:100,tint:0};const reference={...neutral,saturation:139,contrast:115,warmth:100};
const $=selector=>document.querySelector(selector);let state,draft={...neutral},pending=null,busy=false,currentView='adjustments';
const desktop=!!window.screenColor;
const api=window.screenColor||{
 async getState(){return {enabled:false,ready:true,values:{...neutral},profileId:'neutral',profiles:[],preferences:{startup:false,minimizeToTray:true},displays:[],shortcutAvailable:false};},
 async action(type,payload){const next=structuredClone(state);if(type==='values'){next.values=payload;next.enabled=true;next.profileId=null;}if(type==='preset'){next.values=payload==='reference'?reference:payload==='neutral'?neutral:next.profiles.find(p=>p.id===payload).values;next.profileId=payload;next.enabled=payload!=='neutral';}if(type==='toggle')next.enabled=payload;if(type==='reset'){next.values={...neutral};next.enabled=false;next.profileId='neutral';}if(type==='saveProfile'){const p={id:String(Date.now()),name:payload,values:{...next.values}};next.profiles.push(p);next.profileId=p.id;}if(type==='deleteProfile'){next.profiles=next.profiles.filter(p=>p.id!==payload);if(next.profileId===payload)next.profileId=null;}return {ok:true,state:next};},subscribe(){return ()=>{};}
};
function setupControls(){
 for(const d of definitions){const row=document.createElement('div');row.className='control';row.dataset.key=d.key;
  const header=document.createElement('div');header.className='control-header';const label=document.createElement('label');label.htmlFor=d.key;label.textContent=d.label;
  const number=document.createElement('input');number.type='number';number.className='control-number';number.min=d.min;number.max=d.max;number.step=1;number.value=d.neutral;number.setAttribute('aria-label',d.label+' value');
  const unit=document.createElement('span');unit.className='unit';unit.textContent=d.unit;const reset=document.createElement('button');reset.className='control-reset';reset.dataset.icon='Refresh';reset.title='Reset '+d.label.toLowerCase();reset.setAttribute('aria-label',reset.title);
  header.append(label,number,unit,reset);const slider=document.createElement('input');slider.type='range';slider.id=d.key;slider.min=d.min;slider.max=d.max;slider.step=1;slider.value=d.neutral;
  const ends=document.createElement('div');ends.className='range-labels';for(const text of d.ends){const span=document.createElement('span');span.textContent=text;ends.append(span);}
  const help=document.createElement('p');help.className='control-description';help.textContent=d.help;
  function set(value){const n=Number(value);if(!Number.isFinite(n)||n<d.min||n>d.max)return;draft={...draft,[d.key]:n};number.value=n;slider.value=n;window.ImagePreview.update(draft,true,desktop);pending={...draft};flush();}
  slider.addEventListener('input',()=>set(slider.value));number.addEventListener('change',()=>{if(number.value===''||!number.checkValidity()){number.reportValidity();number.value=draft[d.key];return;}set(number.value);});reset.addEventListener('click',()=>set(d.neutral));
  row.append(header,slider,ends,help);$('#controls').append(row);
 }
}
async function flush(){if(busy)return;busy=true;try{while(pending){const next=pending;pending=null;const response=await api.action('values',next);state=response.state;if(!response.ok){pending=null;showError(response.error);break;}render();}}catch(error){pending=null;showError(error.message);}finally{busy=false;if(state){draft={...state.values};render();}}}
async function action(type,payload){
 // Drain live slider updates before a toggle/profile action so its final state wins.
 while(busy)await new Promise(resolve=>setTimeout(resolve,15));
 try{const response=await api.action(type,payload);state=response.state;if(!response.ok){draft={...state.values};render();showError(response.error);return false;}draft={...state.values};render();return true;}catch(error){showError(error.message);return false;}
}
function showError(message){$('#error-text').textContent=message;$('#error-banner').hidden=false;$('#saved-status').textContent='Change could not be applied';}
function render(){
 if(!state)return;if(!busy)draft={...state.values};
 for(const d of definitions){const row=$(`[data-key="${d.key}"]`);for(const input of row.querySelectorAll('input')){if(document.activeElement!==input)input.value=draft[d.key];input.disabled=!state.ready;}row.querySelector('button').disabled=!state.ready;}
 $('#effect-toggle').setAttribute('aria-checked',String(state.enabled));$('#effect-toggle').disabled=!state.ready;$('#effect-text').textContent=state.enabled?'Effect on':'Effect off';
 const connection=$('#connection');connection.replaceChildren();const dot=document.createElement('i');dot.className='status-dot'+(state.ready?' connected':'');connection.append(dot,document.createTextNode(!desktop?'Browser preview':state.smoke?'Interface smoke test':state.ready?'Color engine connected':'Color engine unavailable'));
 $('#error-banner').hidden=!state.error;if(state.error)$('#error-text').textContent=state.error;$('#retry').hidden=state.ready;
 $('#warning-banner').hidden=!state.warning;if(state.warning)$('#warning-banner').textContent=state.warning;
 $('#profile-label').textContent=state.profileId==='reference'?'Peter reference':state.profileId==='neutral'?'Neutral':state.profiles.find(p=>p.id===state.profileId)?.name||'Custom adjustments';
 $('#saved-status').textContent=!desktop?'Preview only · no desktop changes':state.error?'Change could not be applied':state.previewUntil?'Timed preview active':'Saved on this PC';
 $('#reference').disabled=!state.ready;$('#timed-preview').disabled=!state.ready||!desktop;$('#reset-all').disabled=!state.ready;
 $('#open-quick-controls').disabled=!desktop;$('#open-quick-controls').title=desktop?'Open compact controls over your desktop':'Quick controls are available in the Electron app.';
 $('#startup').checked=state.startupActual||false;$('#startup').disabled=!desktop;$('#minimize').checked=state.preferences.minimizeToTray;$('#minimize').disabled=!desktop;
 $('#shortcut-description').textContent=state.shortcutAvailable?'Press the shortcut from any app to turn the effect off.':'Shortcut unavailable. Use the effect switch or the tray menu.';
 $('#display-info').textContent=state.displays?.length?state.displays.map(d=>`${d.name} · ${d.width} × ${d.height}`).join('\n'):'One look across your desktop';
 window.ImagePreview.update(draft,state.enabled,desktop);$('#preview-original').disabled=!state.ready;$('#preview-adjusted').disabled=!state.ready;
 renderProfiles();window.ScreenIcons.paint();
}
function renderProfiles(){
 const container=$('#profile-list');container.replaceChildren();const profiles=[{id:'neutral',name:'Neutral',values:neutral,builtin:true},{id:'reference',name:'Peter reference',values:reference,builtin:true},...state.profiles];
 for(const p of profiles){const row=document.createElement('article');row.className='profile-row';const swatch=document.createElement('span');swatch.className='profile-swatch '+p.id;
  const copy=document.createElement('div');copy.className='profile-copy';const title=document.createElement('strong');title.textContent=p.name;const summary=document.createElement('p');summary.textContent=`Saturation ${p.values.saturation}% · Contrast ${p.values.contrast}% · Warmth ${p.values.warmth}`;copy.append(title,summary);
  const apply=document.createElement('button');apply.className='quiet-button';apply.textContent=state.profileId===p.id?'Selected':'Apply';apply.disabled=!state.ready;apply.addEventListener('click',()=>action('preset',p.id));row.append(swatch,copy,apply);
  if(!p.builtin){const remove=document.createElement('button');remove.className='text-button';remove.dataset.icon='Trash';remove.title='Delete '+p.name;remove.setAttribute('aria-label','Delete '+p.name);remove.addEventListener('click',()=>action('deleteProfile',p.id));row.append(remove);}container.append(row);
 }
}
function showView(name){currentView=name;for(const view of document.querySelectorAll('.view'))view.hidden=view.id!=='view-'+name;for(const button of document.querySelectorAll('[data-view]')){const selected=button.dataset.view===name;button.classList.toggle('selected',selected);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}window.ScreenIcons.paint();}
setupControls();for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>showView(button.dataset.view));
$('#effect-toggle').addEventListener('click',()=>action('toggle',!state.enabled));$('#reference').addEventListener('click',()=>action('preset','reference'));$('#reset-all').addEventListener('click',()=>action('reset'));$('#timed-preview').addEventListener('click',()=>action('preview'));$('#retry').addEventListener('click',()=>action('retry'));
$('#preview-original').addEventListener('click',()=>action('toggle',false));$('#preview-adjusted').addEventListener('click',()=>action('toggle',true));
$('#open-quick-controls').addEventListener('click',()=>action('openPopup'));
$('#startup').addEventListener('change',()=>action('preferences',{startup:$('#startup').checked,minimizeToTray:state.preferences.minimizeToTray}));$('#minimize').addEventListener('change',()=>action('preferences',{startup:state.startupActual||false,minimizeToTray:$('#minimize').checked}));$('#quit').addEventListener('click',()=>action('quit'));
function openProfileDialog(){$('#profile-error').textContent='';$('#profile-name').value='';$('#profile-dialog').showModal();$('#profile-name').focus();}
$('#save-profile').addEventListener('click',openProfileDialog);$('#save-profile-alt').addEventListener('click',openProfileDialog);$('#cancel-profile').addEventListener('click',()=>$('#profile-dialog').close());
$('#profile-form').addEventListener('submit',async event=>{event.preventDefault();if(await action('saveProfile',$('#profile-name').value))$('#profile-dialog').close();else $('#profile-error').textContent='Could not save this profile. Check the message above.';});
$('#preview-notice').hidden=desktop;api.subscribe(next=>{state=next;render();});api.getState().then(next=>{state=next;render();}).catch(error=>showError(error.message));
setInterval(()=>{if(state?.previewUntil){const remaining=Math.max(0,Math.ceil((state.previewUntil-Date.now())/1000));$('#preview-description').textContent=`Timed preview · ${remaining}s remaining. Returns to the previous on/off state.`;}else $('#preview-description').textContent='Optional. Returns to the previous on/off state.';},500);
if(!desktop&&location.protocol==='http:'){const events=new EventSource('/events');events.onmessage=()=>location.reload();}
