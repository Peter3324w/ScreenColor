import {query as $,all} from './dom';
import {object} from '../lib/validation.cjs';
'use strict';
(()=>{
 const design=window.PlaytimeDesign,key='screen-color-appearance';let saved: {theme: string;accent: string|null}={theme:'midnight',accent:null};
 try{const value: unknown=JSON.parse(localStorage.getItem(key)||'null');if(object(value)&&typeof value.theme==='string'&&design.THEMES.some(t=>t.id===value.theme)){saved={theme:value.theme,accent:typeof value.accent==='string'&&design.hexToRgb(value.accent)?value.accent:null};}}catch{}
 function apply(){design.applyAppearance(saved.theme,saved.accent);}
 apply();
 const picker=$('#theme-picker'),color=$<HTMLInputElement>('#accent-color'),hex=$<HTMLInputElement>('#accent-hex'),auto=$<HTMLButtonElement>('#accent-auto'),status=$('#appearance-status');
 function persist(){apply();try{localStorage.setItem(key,JSON.stringify(saved));status.textContent='Appearance saved on this device.';}catch{status.textContent='Appearance changed for this session; it could not be saved.';}render();}
 function render(){for(const button of all('#theme-picker button, #sidebar-theme-picker button')){const on=button.dataset.theme===saved.theme;button.classList.toggle('on',on);button.setAttribute('aria-pressed',String(on));}auto.classList.toggle('on',!saved.accent);auto.setAttribute('aria-pressed',String(!saved.accent));const current=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();color.value=design.hexToRgb(current)?current:'#ffffff';hex.value=saved.accent||'';hex.placeholder=current;}
 for(const target of [picker,$('#sidebar-theme-picker')])for(const theme of design.THEMES){const button=document.createElement('button');button.type='button';button.className='quiet-button theme-swatch';button.dataset.theme=theme.id;button.title=theme.label;button.setAttribute('aria-label',theme.label);const chip=document.createElement('span');chip.className='theme-chip';chip.dataset.palette=theme.id;button.append(chip,document.createTextNode(theme.label));button.addEventListener('click',()=>{saved.theme=theme.id;persist();});target.append(button);}
 const toggle=$<HTMLButtonElement>('#sidebar-theme-toggle'),panel=$('#sidebar-theme-panel');
 function closeTheme(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));});
 panel.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('button')){closeTheme();toggle.focus();}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){closeTheme();toggle.focus();}});
 document.addEventListener('click',event=>{if(event.target instanceof Node&&!panel.contains(event.target)&&!toggle.contains(event.target))closeTheme();});
 const popular=$('#accent-presets');for(const [index,value] of design.ACCENT_POPULAR.entries()){const button=document.createElement('button');button.className='accent-dot accent-dot-'+index;button.title='Use '+value;button.setAttribute('aria-label','Use accent '+value);button.addEventListener('click',()=>{saved.accent=value;persist();});popular.append(button);}
 auto.addEventListener('click',()=>{saved.accent=null;persist();});color.addEventListener('input',()=>{saved.accent=color.value;persist();});hex.addEventListener('change',()=>{if(!hex.value.trim()){saved.accent=null;persist();return;}const rgb=design.hexToRgb(hex.value);if(!rgb){status.textContent='Enter a valid hex color, such as #7c9cff.';render();return;}saved.accent='#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');persist();});render();
})();
