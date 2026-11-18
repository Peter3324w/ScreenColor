'use strict';
const fs=require('node:fs');const path=require('node:path');const {Store}=require('./store.cjs');
const fresh=()=>({version:1,launches:0,tourDone:false,supportDismissed:false,notifiedVersion:null,dismissedVersion:null});
function version(value){return typeof value==='string'&&/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)&&value.split('.').every(n=>Number.isSafeInteger(Number(n)));}
function validate(value){if(!value||value.version!==1||!Number.isSafeInteger(value.launches)||value.launches<0||value.launches>1000000||typeof value.tourDone!=='boolean'||typeof value.supportDismissed!=='boolean')throw new Error('Invalid experience state');for(const key of ['notifiedVersion','dismissedVersion'])if(value[key]!==null&&!version(value[key]))throw new Error('Invalid update version');return {...fresh(),launches:value.launches,tourDone:value.tourDone,supportDismissed:value.supportDismissed,notifiedVersion:value.notifiedVersion,dismissedVersion:value.dismissedVersion};}
class ExperienceStore{
 constructor(file){this.file=file;this.state=fresh();for(const source of [file,file+'.bak']){try{this.state=validate(JSON.parse(fs.readFileSync(source,'utf8')));break;}catch{}}}
 atomicWrite(file,payload){return Store.prototype.atomicWrite.call(this,file,payload);}
 snapshot(){return {...this.state,supportDue:this.state.launches>=4&&!this.state.supportDismissed};}
 change(patch){const next=validate({...this.state,...patch});fs.mkdirSync(path.dirname(this.file),{recursive:true});const payload=JSON.stringify(next,null,2);this.atomicWrite(this.file,payload);this.state=next;try{this.atomicWrite(this.file+'.bak',payload);}catch{}return this.snapshot();}
 recordLaunch(background){return background?this.snapshot():this.change({launches:Math.min(1000000,this.state.launches+1)});}
 finishTour(){return this.change({tourDone:true});}
 dismissSupport(){return this.change({supportDismissed:true});}
 markNotified(value){if(!version(value))throw new Error('Invalid update version');return this.change({notifiedVersion:value});}
 dismissUpdate(value){if(!version(value))throw new Error('Invalid update version');return this.change({dismissedVersion:value});}
}
module.exports={ExperienceStore};
