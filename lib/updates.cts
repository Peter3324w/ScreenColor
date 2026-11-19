import { EventEmitter } from 'node:events';
import { object } from './validation.cjs';
import type { AvailableUpdate,UpdateSnapshot } from '../shared/types';
const RELEASE_API='https://api.github.com/repos/Peter3324w/ScreenColor/releases/latest';
const RELEASES='https://github.com/Peter3324w/ScreenColor/releases';
function parts(value: unknown): number[]|null {
  if(typeof value!=='string'||!/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))return null;
  const result=value.replace(/^v/,'').split('.').map(Number);return result.every(Number.isSafeInteger)?result:null;
}
export function compareVersions(a: unknown,b: unknown): number {
  const x=parts(a),y=parts(b);if(!x||!y)throw new Error('Invalid stable version');for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;
}
function releaseInfo(data: unknown): AvailableUpdate|null {
  if(!object(data)||data.draft!==false||data.prerelease!==false||typeof data.tag_name!=='string'||!parts(data.tag_name)||!Array.isArray(data.assets))return null;
  const version=data.tag_name.replace(/^v/,'');const releaseURL=RELEASES+'/tag/'+data.tag_name;if(data.html_url!==releaseURL)return null;
  const name=`Screen-Color-Setup-${version}-x64.exe`,downloadURL=RELEASES+'/download/'+data.tag_name+'/'+name;
  for(const asset of data.assets as unknown[]){
    if(object(asset)&&asset.name===name&&asset.browser_download_url===downloadURL&&typeof asset.size==='number'&&Number.isSafeInteger(asset.size)&&asset.size>0){
      return {version,url:downloadURL,releaseURL,size:asset.size};
    }
  }return null;
}
export function releaseUpdate(data: unknown,current: unknown): AvailableUpdate|null {
  const release=releaseInfo(data);return release&&parts(current)&&compareVersions(release.version,current)>0?release:null;
}
export async function smallJSON(response: Response,limit=128*1024): Promise<unknown> {
  const length=response.headers.get('content-length');if(length&&Number(length)>limit)throw new Error('Response too large');if(!response.body)throw new Error('Empty response');
  const reader=response.body.getReader(),chunks: Buffer[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new Error('Response too large');chunks.push(Buffer.from(value));}return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}
  catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
}
export class UpdateChecker extends EventEmitter<{state: [UpdateSnapshot]}> {
  current: string;
  fetch: typeof globalThis.fetch;
  timeoutMs: number;
  state: UpdateSnapshot;
  pending: Promise<UpdateSnapshot>|null=null;
  constructor({current,fetch=globalThis.fetch,timeoutMs=12000}: {current: string; fetch?: typeof globalThis.fetch; timeoutMs?: number}) {
    super();this.current=current;this.fetch=fetch;this.timeoutMs=timeoutMs;this.state={current,status:'idle',available:null,error:null,checkedAt:null};
  }
  snapshot(): UpdateSnapshot { return structuredClone(this.state); }
  publish(): void { this.emit('state',this.snapshot()); }
  check(): Promise<UpdateSnapshot> {
    if(this.pending)return this.pending;this.state.status='checking';this.state.error=null;this.publish();this.pending=this.run().finally(()=>{this.pending=null;});return this.pending;
  }
  async fetchMetadata(signal: AbortSignal): Promise<unknown> {
    const response=await this.fetch(RELEASE_API,{headers:{Accept:'application/vnd.github+json','User-Agent':'ScreenColor/'+this.current},signal,redirect:'error'});
    if(signal.aborted)throw new Error('Update check canceled');if(response.status===404)return null;if(!response.ok||response.redirected)throw new Error('Update service unavailable');return smallJSON(response);
  }
  async run(): Promise<UpdateSnapshot> {
    const controller=new AbortController();let timer: ReturnType<typeof setTimeout>|undefined;
    const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Update check timed out'));},this.timeoutMs);});
    try{
      // Fetch work never mutates state: a timed-out response cannot overwrite a newer check.
      const data=await Promise.race([this.fetchMetadata(controller.signal),timeout]);
      if(data===null){this.state.status=this.state.available?'available':'current';}
      else{const release=releaseInfo(data);if(!release)throw new Error('Invalid release metadata');const available=compareVersions(release.version,this.current)>0?release:null;this.state.available=available;this.state.status=available?'available':'current';}
      this.state.checkedAt=Date.now();
    }catch{this.state.status='error';this.state.error='Could not check for updates. Check your connection and try again.';}
    finally{clearTimeout(timer);this.publish();}return this.snapshot();
  }
}
