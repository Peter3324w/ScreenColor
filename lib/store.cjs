'use strict';
const fs=require('node:fs');const path=require('node:path');const {defaultState,validateState}=require('./model.cjs');
class Store{
 constructor(file){this.file=file;}
 load(){try{return {state:validateState(JSON.parse(fs.readFileSync(this.file,'utf8'))),warning:null};}catch(e){return {state:defaultState(),warning:e.code==='ENOENT'?null:'Saved settings could not be read. Started safely with the effect off; the original file is kept until you save a change.'};}}
 save(state){const valid=validateState(state);fs.mkdirSync(path.dirname(this.file),{recursive:true});const temp=this.file+'.'+process.pid+'.tmp';
  try {fs.writeFileSync(temp,JSON.stringify(valid,null,2),'utf8');fs.renameSync(temp,this.file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
 }
}
module.exports={Store};
