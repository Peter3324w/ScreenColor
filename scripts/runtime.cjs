'use strict';
const fs=require('node:fs');const path=require('node:path');
function findRuntime(){
 const candidates=[process.env.SCREEN_COLOR_ELECTRON,path.join(__dirname,'..','node_modules','electron','dist','electron.exe'),...['Download-manager','Playtime','Video-library','Slipstream'].map(name=>path.resolve(__dirname,'..','..',name,'node_modules','electron','dist','electron.exe'))].filter(Boolean);
 const found=candidates.find(file=>fs.existsSync(file));if(!found)throw new Error('No local Electron runtime found. Set SCREEN_COLOR_ELECTRON to an existing electron.exe. No download was attempted.');return found;
}
module.exports={findRuntime};
