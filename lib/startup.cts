import { execFileSync } from 'node:child_process';
import { object } from './validation.cjs';
import type { StartupOptions } from './platform.cjs';
const RUN='HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const APPROVED='HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run';
interface RegistryState { command: string|null; approval: string|null }
interface Registry { read(): RegistryState; write(value: RegistryState): void }
interface StartupStatus { registered: boolean; enabled: boolean }
function status(error: unknown): unknown { return object(error)?error.status:undefined; }
export class WindowsRegistry implements Registry {
  constructor(public name: string) {}
  run(args: string[]): string { return execFileSync('reg.exe',args,{encoding:'utf8',windowsHide:true,timeout:3000,stdio:['ignore','pipe','pipe']}); }
  value(key: string,type: string): string|null {
    try{const text=this.run(['query',key,'/v',this.name]);const match=text.match(new RegExp('\\s'+type+'\\s+([^\\r\\n]*)'));if(!match)throw new Error('Unexpected startup registry format');return match[1].trim();}
    catch(error){
      if(status(error)!==1)throw error;
      // reg.exe localizes its error text. Inspect readable keys instead of matching English.
      let ancestor=key;
      for(;;){
        let listing: string;
        try{listing=this.run(['query',ancestor]);}catch(probeError){if(status(probeError)!==1)throw probeError;const split=ancestor.lastIndexOf('\\');if(split<0)throw error;ancestor=ancestor.slice(0,split);continue;}
        if(ancestor===key)return null;
        const child=ancestor+'\\'+key.slice(ancestor.length+1).split('\\')[0];const normalized=child.replace(/^HKCU/i,'HKEY_CURRENT_USER').toLowerCase();
        if(listing.split(/\r?\n/).some(line=>line.trim().toLowerCase()===normalized))throw error;
        return null;
      }
    }
  }
  read(): RegistryState { return {command:this.value(RUN,'REG_SZ'),approval:this.value(APPROVED,'REG_BINARY')}; }
  put(key: string,type: string,value: string|null): void {
    if(value===null){if(this.value(key,type)===null)return;try{this.run(['delete',key,'/v',this.name,'/f']);}catch(error){if(status(error)!==1||this.value(key,type)!==null)throw error;}}
    else this.run(['add',key,'/v',this.name,'/t',type,'/d',value,'/f']);
  }
  write(value: RegistryState): void { this.put(RUN,'REG_SZ',value.command);this.put(APPROVED,'REG_BINARY',value.approval); }
}
export class StartupRegistration {
  queue: Promise<unknown>=Promise.resolve();
  command: string;
  legacy: string;
  constructor(public options: StartupOptions,public registry: Registry=new WindowsRegistry(options.name)) {
    this.command=[options.path,...options.args].join(' ');this.legacy=[options.path,...options.args].map(value=>value.replace(/^"(.*)"$/,'$1')).join(' ');
  }
  status(): StartupStatus {
    const value=this.registry.read(),command=value.command;
    const registered=typeof command==='string'&&[this.command,this.legacy].some(expected=>expected.toLowerCase()===command.toLowerCase());
    const approval=value.approval?.slice(0,2).toLowerCase();return {registered,enabled:registered&&(!approval||approval==='02'||approval==='06')};
  }
  repairLegacy(): StartupStatus {
    const previous=this.registry.read();
    if(previous.command?.toLowerCase()===this.legacy.toLowerCase()&&previous.command!==this.command){
      try{this.registry.write({...previous,command:this.command});if(!this.status().registered)throw new Error('Windows did not confirm the startup registration.');}
      catch(error){this.registry.write(previous);throw error;}
    }return this.status();
  }
  set(enabled: boolean,commit: ()=>Promise<void>): Promise<StartupStatus> {
    const task=this.queue.then(()=>this.change(enabled,commit));this.queue=task.catch(()=>{});return task;
  }
  async change(enabled: boolean,commit: ()=>Promise<void>): Promise<StartupStatus> {
    if(typeof enabled!=='boolean')throw new Error('Invalid startup setting');const previous=this.registry.read();
    try{this.registry.write({command:enabled?this.command:null,approval:null});if(this.status().enabled!==enabled||(enabled&&!this.status().registered))throw new Error('Windows did not confirm the startup registration.');await commit();return this.status();}
    catch(error){try{this.registry.write(previous);}catch{throw new Error('Windows startup could not be changed or restored. Check Startup apps in Windows Settings.');}throw error;}
  }
}
