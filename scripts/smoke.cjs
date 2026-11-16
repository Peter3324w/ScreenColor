'use strict';
const {spawnSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');const {compile}=require('./compile.cjs');const {findRuntime}=require('./runtime.cjs');
compile();const root=path.resolve(__dirname,'..'),report=path.join(root,'.local','smoke.json');if(fs.existsSync(report))fs.unlinkSync(report);const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const result=spawnSync(findRuntime(),[root,'--smoke'],{env,windowsHide:true,encoding:'utf8',timeout:25000});
if(result.error)console.error(result.error.message);if(fs.existsSync(report)){const data=JSON.parse(fs.readFileSync(report,'utf8'));console.log(JSON.stringify(data,null,2));process.exitCode=data.ok&&result.status===0?0:1;}else{console.error(result.stderr||`Electron did not produce a smoke report (exit ${result.status}).`);const log=path.join(root,'.local','startup.log');if(fs.existsSync(log))console.error(fs.readFileSync(log,'utf8'));process.exitCode=1;}
