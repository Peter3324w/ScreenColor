'use strict';
const fs=require('node:fs'),path=require('node:path');const {compile}=require('./compile.cjs');const {findRuntime,findBuilder}=require('./runtime.cjs');
require('./compile-app.cjs').compileApp();
const root=path.resolve(__dirname,'..');
function builderModule(){return require(findBuilder());}
(async()=>{compile();const electronDist=path.dirname(findRuntime());const electronVersion=fs.readFileSync(path.join(electronDist,'version'),'utf8').trim();if(!fs.existsSync(path.join(root,'build/icon.ico')))throw new Error('Run node scripts/create-icon.cjs first.');process.env.CSC_IDENTITY_AUTO_DISCOVERY='false';const builder=builderModule();const config={...require('../electron-builder.cjs'),electronDist,electronVersion};const target=process.argv.includes('--dir')?'dir':'nsis';const artifacts=await builder.build({projectDir:root,targets:builder.Platform.WINDOWS.createTarget(target,builder.Arch.x64),config,publish:'never'});console.log(JSON.stringify({target,electronVersion,artifacts},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
