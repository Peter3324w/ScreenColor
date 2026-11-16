'use strict';
const {EventEmitter}=require('node:events');const {spawn}=require('node:child_process');const readline=require('node:readline');
class NativeBridge extends EventEmitter{
 constructor(executable,dataDir,options={}){super();this.executable=executable;this.dataDir=dataDir;this.spawn=options.spawn||spawn;this.timeoutMs=options.timeoutMs||5000;this.pending=new Map();this.sequence=0;this.child=null;this.ready=false;this.starting=null;this.closing=false;}
 start(){if(this.starting)return this.starting;if(this.child&&this.ready)return Promise.resolve();if(this.child){const stale=this.child;this.child=null;stale.kill();}this.closing=false;
  this.starting=new Promise((resolve,reject)=>{
   const child=this.spawn(this.executable,[String(process.pid),this.dataDir],{windowsHide:true,stdio:['pipe','pipe','pipe']});this.child=child;
   let failed=false;
   const fail=error=>{if(failed)return;failed=true;clearTimeout(timer);const current=this.child===child;if(current){this.child=null;this.ready=false;for(const item of this.pending.values()){clearTimeout(item.timer);item.reject(error);}this.pending.clear();}reject(error);if(current&&!this.closing)this.emit('failure',error);child.kill();};
   const timer=setTimeout(()=>{fail(new Error('Color engine did not start.'));child.kill();},this.timeoutMs);
   const lines=readline.createInterface({input:child.stdout});lines.on('line',line=>{
    if(failed)return;let response;try{response=JSON.parse(line);}catch{fail(new Error('Invalid color-engine response.'));return;}
    if(response.id===0){clearTimeout(timer);if(response.ok){this.ready=true;resolve();}else{fail(new Error(response.error||'Color engine initialization failed.'));}return;}
    const waiter=this.pending.get(response.id);if(!waiter)return;clearTimeout(waiter.timer);this.pending.delete(response.id);if(response.ok)waiter.resolve(response);else waiter.reject(new Error(response.error||'Color engine rejected the change.'));
   });
   child.stderr.on('data',()=>{});child.on('error',error=>{clearTimeout(timer);fail(error);});child.stdin.on('error',error=>{if(!this.closing)fail(error);});
   child.once('close',()=>{clearTimeout(timer);fail(new Error('Color engine stopped. Retry to reconnect.'));});
  }).finally(()=>{this.starting=null;});return this.starting;
 }
 request(command){if(!this.child||!this.ready||(this.closing&&command.command!=='quit'))return Promise.reject(new Error('Color engine is disconnected.'));
  const id=++this.sequence;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Color engine response timed out.'));this.child?.kill();},this.timeoutMs);this.pending.set(id,{resolve,reject,timer});this.child.stdin.write(JSON.stringify({...command,id})+'\n',error=>{if(error){clearTimeout(timer);this.pending.delete(id);reject(error);}});});
 }
 async close(){if(!this.child)return;const child=this.child;this.closing=true;try{await this.request({command:'quit'});}catch{}child.stdin.end();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();const timer=setTimeout(()=>{child.kill();resolve();},1500);child.once('close',()=>{clearTimeout(timer);resolve();});});}
}
module.exports={NativeBridge};
