import fs = require('node:fs');
import path = require('node:path');
import { defaultState, validateState } from './model.cjs';
import { errorCode } from './validation.cjs';
import type { PersistedState } from '../shared/types';
export interface StateStore { load(): {state: PersistedState; warning?: string|null}; save(state: PersistedState): void }

export class Store implements StateStore {
  backupError: unknown=null;
  constructor(public file: string) {}
  load(): {state: PersistedState; warning: string|null} {
    try{return {state:validateState(JSON.parse(fs.readFileSync(this.file,'utf8')) as unknown),warning:null};}
    catch(error){
      try{return {state:validateState(JSON.parse(fs.readFileSync(this.file+'.bak','utf8')) as unknown),warning:'Recovered saved settings from backup. Your profiles and adjustments have been restored.'};}catch{}
      return {state:defaultState(),warning:errorCode(error)==='ENOENT'?null:'Saved settings and their backup could not be read. Started safely with the effect off; existing files are kept until you save a change.'};
    }
  }
  atomicWrite(file: string,payload: string): void {
    const temp=file+'.'+process.pid+'.tmp';let fd: number|undefined;
    try{fd=fs.openSync(temp,'w');fs.writeFileSync(fd,payload,'utf8');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}
    finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(temp))fs.unlinkSync(temp);}
  }
  save(state: unknown): void {
    const valid=validateState(state);fs.mkdirSync(path.dirname(this.file),{recursive:true});const payload=JSON.stringify(valid,null,2);this.atomicWrite(this.file,payload);
    // A backup failure must not report the already committed primary save as failed.
    try{this.atomicWrite(this.file+'.bak',payload);this.backupError=null;}catch(error){this.backupError=error;}
  }
}
