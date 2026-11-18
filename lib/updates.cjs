'use strict';
const {EventEmitter}=require('node:events');
const RELEASE_API='https://api.github.com/repos/Peter3324w/ScreenColor/releases/latest';
const RELEASES='https://github.com/Peter3324w/ScreenColor/releases';
function parts(value){if(typeof value!=='string'||!/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))return null;const result=value.replace(/^v/,'').split('.').map(Number);return result.every(Number.isSafeInteger)?result:null;}
function compareVersions(a,b){const x=parts(a),y=parts(b);if(!x||!y)throw new Error('Invalid stable version');for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;}
function releaseInfo(data){if(!data||data.draft!==false||data.prerelease!==false||!parts(data.tag_name)||!Array.isArray(data.assets))return null;const version=data.tag_name.replace(/^v/,'');const releaseURL=RELEASES+'/tag/'+data.tag_name;if(data.html_url!==releaseURL)return null;const name=`Screen-Color-Setup-${version}-x64.exe`;const downloadURL=RELEASES+'/download/'+data.tag_name+'/'+name;const asset=data.assets.find(a=>a.name===name&&a.browser_download_url===downloadURL&&Number.isSafeInteger(a.size)&&a.size>0);return asset?{version,url:downloadURL,releaseURL,size:asset.size}:null;}
function releaseUpdate(data,current){const release=releaseInfo(data);return release&&parts(current)&&compareVersions(release.version,current)>0?release:null;}
async function smallJSON(response,limit=128*1024){const length=response.headers.get('content-length');if(length&&Number(length)>limit)throw new Error('Response too large');if(!response.body)throw new Error('Empty response');const reader=response.body.getReader(),chunks=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new Error('Response too large');chunks.push(Buffer.from(value));}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}}
class UpdateChecker extends EventEmitter{
 constructor({current,fetch=globalThis.fetch,timeoutMs=12000}){super();this.current=current;this.fetch=fetch;this.timeoutMs=timeoutMs;this.state={current,status:'idle',available:null,error:null,checkedAt:null};this.pending=null;}
 snapshot(){return structuredClone(this.state);}
 publish(){this.emit('state',this.snapshot());}
 check(){if(this.pending)return this.pending;this.state.status='checking';this.state.error=null;this.publish();this.pending=this.run().finally(()=>{this.pending=null;});return this.pending;}
 async fetchMetadata(signal){const response=await this.fetch(RELEASE_API,{headers:{Accept:'application/vnd.github+json','User-Agent':'ScreenColor/'+this.current},signal,redirect:'error'});if(signal.aborted)throw new Error('Update check canceled');if(response.status===404)return null;if(!response.ok||response.redirected)throw new Error('Update service unavailable');return smallJSON(response);}
 async run(){
  const controller=new AbortController();let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Update check timed out'));},this.timeoutMs);});
  try{
   // Fetch work never mutates state: a timed-out response cannot overwrite a newer check.
   const data=await Promise.race([this.fetchMetadata(controller.signal),timeout]);
   if(data===null){this.state.status=this.state.available?'available':'current';}
   else{const release=releaseInfo(data);if(!release)throw new Error('Invalid release metadata');const available=compareVersions(release.version,this.current)>0?release:null;this.state.available=available;this.state.status=available?'available':'current';}
   this.state.checkedAt=Date.now();
  }catch{this.state.status='error';this.state.error='Could not check for updates. Check your connection and try again.';}
  finally{clearTimeout(timer);this.publish();}
  return this.snapshot();
 }
}
module.exports={compareVersions,releaseUpdate,UpdateChecker,smallJSON};
