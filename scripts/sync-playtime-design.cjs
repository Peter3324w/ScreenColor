'use strict';
// Read-only import from Peter's PlayTime checkout. Writes only this app's UI.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'..','Playtime');
const base=fs.readFileSync(path.join(source,'src/renderer/src/styles/00-base.css'),'utf8');
const end=base.indexOf('\n* {');if(end<0)throw new Error('PlayTime token boundary not found.');
fs.writeFileSync(path.join(root,'ui/playtime-tokens.css'),'/* Copied from PlayTime styles/00-base.css; regenerate with scripts/sync-playtime-design.cjs. */\n'+base.slice(0,end).trimEnd()+'\n');
const util=fs.readFileSync(path.join(source,'src/renderer/src/lib/util.js'),'utf8');
const start=util.indexOf('export const THEMES =');if(start<0)throw new Error('PlayTime appearance helpers not found.');
const helpers=util.slice(start).replace(/\bexport /g,'');
fs.writeFileSync(path.join(root,'ui/playtime-appearance.js'),`/* Appearance helpers copied from PlayTime lib/util.js. */\n(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlaytimeDesign=api;})(globalThis,function(){\n${helpers}\nreturn {THEMES,applyTheme,applyAccent,applyAppearance,hexToRgb,accentSwatch,nextAccentRecents,ACCENT_POPULAR};\n});\n`);
const React=require(path.join(source,'node_modules/react'));const {renderToStaticMarkup}=require(path.join(source,'node_modules/react-dom/server'));
const names=['Setting4','Layer','Setting2','Monitor','Refresh','Gallery','SaveAdd','Trash','Add','CloseCircle','Colorfilter','TickCircle','Cpu'];
const icons={};for(const name of names){const Icon=require(path.join(source,'node_modules/iconsax-react/dist/cjs',name+'.js'));icons[name]={};for(const variant of ['Linear','Bulk'])icons[name][variant]=renderToStaticMarkup(React.createElement(Icon,{size:20,color:'currentColor',variant,'aria-hidden':true}));}
fs.writeFileSync(path.join(root,'ui/icons.js'),`/* Static Iconsax React 0.0.8 SVG exports from PlayTime's installed package. See docs/design-system.md. */\n'use strict';\nwindow.ScreenIcons={icons:${JSON.stringify(icons)},paint(root=document){for(const element of root.querySelectorAll('[data-icon]')){const name=element.dataset.icon;const variant=element.closest('.nav-item.selected')?'Bulk':element.dataset.variant||'Linear';const source=this.icons[name]?.[variant];if(source&&element.dataset.painted!==name+variant){const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;element.replaceChildren(document.importNode(svg,true));element.dataset.painted=name+variant;}}}};\n`);
console.log('Copied PlayTime tokens, five themes, accent helpers, and 13 Iconsax icon families. No source files changed.');
