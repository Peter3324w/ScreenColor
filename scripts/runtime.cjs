'use strict';
const fs=require('node:fs');const path=require('node:path');
function projectRoot(options){return options.root||path.resolve(__dirname,'..');}
function pinnedVersion(root,name){return JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).devDependencies[name];}
function selectVersion(candidates,expected,readVersion,label){
 const rejected=[];
 for(const candidate of candidates){
  if(!fs.existsSync(candidate))continue;
  let actual;try{actual=readVersion(candidate).trim();}catch{actual='missing or unreadable version';}
  if(actual===expected)return candidate;
  rejected.push(`${candidate}: ${actual}`);
 }
 throw new Error(`No compatible local ${label} found. Required ${expected}.${rejected.length?' Rejected: '+rejected.join(';'):''} No download was attempted.`);
}
function findRuntime(options={}){
 const root=projectRoot(options),env=options.env||process.env;
 const candidates=env.SCREEN_COLOR_ELECTRON?[env.SCREEN_COLOR_ELECTRON]:[path.join(root,'node_modules','electron','dist','electron.exe'),...['Download-manager','Playtime','Video-library','Slipstream'].map(name=>path.resolve(root,'..',name,'node_modules','electron','dist','electron.exe'))];
 return selectVersion(candidates,pinnedVersion(root,'electron'),file=>fs.readFileSync(path.join(path.dirname(file),'version'),'utf8'),'Electron runtime');
}
function findBuilder(options={}){
 const root=projectRoot(options);
 // A neighboring builder resolves its own dependencies, outside this project's security overrides.
 const candidates=[path.join(root,'node_modules','electron-builder')];
 return selectVersion(candidates,pinnedVersion(root,'electron-builder'),dir=>JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8')).version,'electron-builder');
}
module.exports={findRuntime,findBuilder};
