import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from 'node:child_process';
import readline = require('node:readline');
import { object } from './validation.cjs';
import type { NativeCommand, NativeReply } from '../shared/types';

export interface EngineBridge {
  on(event: 'failure',listener: (error: Error)=>void): unknown;
  start(): Promise<void>;
  request(command: NativeCommand): Promise<unknown>;
  close(): Promise<void>;
}
type SpawnEngine=(executable: string,args: string[],options: SpawnOptionsWithoutStdio)=>ChildProcessWithoutNullStreams;
interface Pending { resolve(reply: NativeReply): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }
function reply(value: unknown): NativeReply {
  if(!object(value)||typeof value.id!=='number'||!Number.isSafeInteger(value.id)||value.id<0||typeof value.ok!=='boolean'||
    (value.error!==undefined&&typeof value.error!=='string')||(value.ready!==undefined&&typeof value.ready!=='boolean'))throw new Error('Invalid color-engine response.');
  return value.ok?{id:value.id,ok:true}:{id:value.id,ok:false,error:typeof value.error==='string'?value.error:''};
}
export class NativeBridge extends EventEmitter implements EngineBridge {
  spawn: SpawnEngine;
  timeoutMs: number;
  pending=new Map<number,Pending>();
  sequence=0;
  child: ChildProcessWithoutNullStreams|null=null;
  ready=false;
  starting: Promise<void>|null=null;
  closing=false;
  constructor(public executable: string,public dataDir: string,options: {spawn?: SpawnEngine; timeoutMs?: number}={}) {
    super();this.spawn=options.spawn??spawn;this.timeoutMs=options.timeoutMs||5000;
  }
  start(): Promise<void> {
    if(this.starting)return this.starting;if(this.child&&this.ready)return Promise.resolve();
    if(this.child){const stale=this.child;this.child=null;stale.kill();}this.closing=false;
    this.starting=new Promise<void>((resolve,reject)=>{
      const child=this.spawn(this.executable,[String(process.pid),this.dataDir],{windowsHide:true,stdio:['pipe','pipe','pipe']});this.child=child;
      let failed=false;
      const fail=(error: Error)=>{
        if(failed)return;failed=true;clearTimeout(timer);const current=this.child===child;
        if(current){this.child=null;this.ready=false;for(const item of this.pending.values()){clearTimeout(item.timer);item.reject(error);}this.pending.clear();}
        reject(error);if(current&&!this.closing)this.emit('failure',error);child.kill();
      };
      const timer=setTimeout(()=>{fail(new Error('Color engine did not start.'));child.kill();},this.timeoutMs);
      const lines=readline.createInterface({input:child.stdout});lines.on('line',(line: string)=>{
        if(failed)return;let response: NativeReply;
        try{response=reply(JSON.parse(line) as unknown);}catch{fail(new Error('Invalid color-engine response.'));return;}
        if(response.id===0){clearTimeout(timer);if(response.ok){this.ready=true;resolve();}else fail(new Error(response.error||'Color engine initialization failed.'));return;}
        const waiter=this.pending.get(response.id);if(!waiter)return;clearTimeout(waiter.timer);this.pending.delete(response.id);
        if(response.ok)waiter.resolve(response);else waiter.reject(new Error(response.error||'Color engine rejected the change.'));
      });
      child.stderr.on('data',()=>{});child.on('error',(error: Error)=>{clearTimeout(timer);fail(error);});
      child.stdin.on('error',(error: Error)=>{if(!this.closing)fail(error);});
      child.once('close',()=>{clearTimeout(timer);fail(new Error('Color engine stopped. Retry to reconnect.'));});
    }).finally(()=>{this.starting=null;});return this.starting;
  }
  request(command: NativeCommand): Promise<NativeReply> {
    const child=this.child;
    if(!child||!this.ready||(this.closing&&command.command!=='quit'))return Promise.reject(new Error('Color engine is disconnected.'));
    const id=++this.sequence;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Color engine response timed out.'));this.child?.kill();},this.timeoutMs);
      this.pending.set(id,{resolve,reject,timer});
      child.stdin.write(JSON.stringify({...command,id})+'\n',(error?: Error|null)=>{if(error){clearTimeout(timer);this.pending.delete(id);reject(error);}});
    });
  }
  async close(): Promise<void> {
    if(!this.child)return;const child=this.child;this.closing=true;try{await this.request({command:'quit'});}catch{}child.stdin.end();
    await new Promise<void>(resolve=>{
      if(child.exitCode!==null)return resolve();const timer=setTimeout(()=>{child.kill();resolve();},1500);
      child.once('close',()=>{clearTimeout(timer);resolve();});
    });
  }
}
