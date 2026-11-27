import {query as $} from './dom';
'use strict';
// Sidebar Customise menu, after PlayTime's: Feedback, Tips, Theme and Settings
// open upward from one button; Help me stays outside it.
(()=>{
 const root=$('#sidebar-customise'),button=$<HTMLButtonElement>('#sidebar-customise-button'),options=$('#sidebar-customise-options'),themePanel=$('#sidebar-theme-panel');
 function setOpen(open: boolean){options.hidden=!open;button.setAttribute('aria-expanded',String(open));button.classList.toggle('open',open);}
 function close(focus=false){if(options.hidden)return;setOpen(false);if(focus)button.focus();}
 button.addEventListener('click',()=>setOpen(options.hidden));
 // Going to a page closes the menu; picking a theme keeps it open, as in PlayTime.
 options.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('[data-view]'))close();});
 document.addEventListener('pointerdown',event=>{if(event.target instanceof Node&&!root.contains(event.target))close();});
 // The theme panel owns Escape while it is open; the next Escape closes the menu.
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!options.hidden&&themePanel.hidden){event.stopPropagation();close(true);}});
})();
