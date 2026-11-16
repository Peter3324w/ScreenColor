'use strict';
const {EventEmitter}=require('node:events');const {spawn}=require('node:child_process');const readline=require('node:readline');
class NativeBridge extends EventEmitter{
 constructor(executable,dataDir,options={}){super();this.executable=executable;this.dataDir=dataDir;this.spawn=options.spawn||spawn;this.timeoutMs=options.timeoutMs||5000;this.pending=new Map();this.sequence=0;this.child=null;this.starting=null;this.closing=false;}
 start(){if(this.starting)return this.starting;if(this.child)return Promise.resolve();this.closing=false;
  this.starting=new Promise((resolve,reject)=>{
   const child=this.spawn(this.executable,[String(process.pid),this.dataDir],{windowsHide:true,stdio:['pipe','pipe','pipe']});this.child=child;
   const fail=error=>{for(const item of this.pending.values()){clearTimeout(item.timer);item.reject(error);}this.pending.clear();reject(error);if(!this.closing)this.emit('failure',error);};
   const timer=setTimeout(()=>{fail(new Error('Color engine did not start.'));child.kill();},this.timeoutMs);
   const lines=readline.createInterface({input:child.stdout});lines.on('line',line=>{
    let response;try{response=JSON.parse(line);}catch{fail(new Error('Invalid color-engine response.'));child.kill();return;}
    if(response.id===0){clearTimeout(timer);if(response.ok)resolve();else{fail(new Error(response.error||'Color engine initialization failed.'));}return;}
    const waiter=this.pending.get(response.id);if(!waiter)return;clearTimeout(waiter.timer);this.pending.delete(response.id);if(response.ok)waiter.resolve(response);else waiter.reject(new Error(response.error||'Color engine rejected the change.'));
   });
   child.stderr.on('data',()=>{});child.on('error',error=>{clearTimeout(timer);if(this.child===child)this.child=null;fail(error);});child.stdin.on('error',error=>{if(!this.closing)fail(error);});
   child.once('close',()=>{clearTimeout(timer);if(this.child===child)this.child=null;fail(new Error('Color engine stopped. Retry to reconnect.'));});
  }).finally(()=>{this.starting=null;});return this.starting;
 }
 request(command){if(!this.child||this.closing)return Promise.reject(new Error('Color engine is disconnected.'));
  const id=++this.sequence;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Color engine response timed out.'));this.child?.kill();},this.timeoutMs);this.pending.set(id,{resolve,reject,timer});this.child.stdin.write(JSON.stringify({...command,id})+'\n',error=>{if(error){clearTimeout(timer);this.pending.delete(id);reject(error);}});});
 }
 async close(){if(!this.child)return;const child=this.child;this.closing=true;try{this.closing=false;await this.request({command:'quit'});}catch{}finally{this.closing=true;}child.stdin.end();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();const timer=setTimeout(()=>{child.kill();resolve();},1500);child.once('close',()=>{clearTimeout(timer);resolve();});});}
}
module.exports={NativeBridge};
