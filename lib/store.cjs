'use strict';
const fs=require('node:fs');const path=require('node:path');const {defaultState,validateState}=require('./model.cjs');
class Store{
 constructor(file){this.file=file;}
 load(){try{return {state:validateState(JSON.parse(fs.readFileSync(this.file,'utf8'))),warning:null};}catch(e){
  try{return {state:validateState(JSON.parse(fs.readFileSync(this.file+'.bak','utf8'))),warning:'Recovered saved settings from backup. Your profiles and adjustments have been restored.'};}catch{}
  return {state:defaultState(),warning:e.code==='ENOENT'?null:'Saved settings and their backup could not be read. Started safely with the effect off; existing files are kept until you save a change.'};
 }}
 atomicWrite(file,payload){const temp=file+'.'+process.pid+'.tmp';let fd;
  try{fd=fs.openSync(temp,'w');fs.writeFileSync(fd,payload,'utf8');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(temp))fs.unlinkSync(temp);}
 }
 save(state){const valid=validateState(state);fs.mkdirSync(path.dirname(this.file),{recursive:true});const payload=JSON.stringify(valid,null,2);this.atomicWrite(this.file,payload);
  // A backup failure must not report the already committed primary save as failed.
  try{this.atomicWrite(this.file+'.bak',payload);this.backupError=null;}catch(error){this.backupError=error;}
 }
}
module.exports={Store};
