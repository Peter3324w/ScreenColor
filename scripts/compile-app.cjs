'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const output=path.join(root,'out');
function compileApp(){
 const emitted=new Set();
 const compiler=path.join(root,'node_modules','typescript','bin','tsc');
 if(!fs.existsSync(compiler))throw new Error('Install this project\'s tooling with npm ci --workspace @screen-color/typescript-tooling --ignore-scripts first. No download was attempted.');
 for(const config of ['tsconfig.node.json','tsconfig.dom.json']){
  const result=spawnSync(process.execPath,[compiler,'-p',path.join(root,config),'--listEmittedFiles'],{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}});
  if(result.error||result.status!==0)throw new Error(result.error?.message||result.stdout||result.stderr||'TypeScript compilation failed.');
  for(const line of result.stdout.split(/\r?\n/))if(line.startsWith('TSFILE: '))emitted.add(path.resolve(line.slice(8)));
 }
 // TypeScript emits JS/TS; copy only the remaining renderer assets. Never write into source.
 for(const file of fs.readdirSync(path.join(root,'ui'))){
  if(/\.(?:html|css|jpg|png|svg|webp|avif)$/.test(file)){
   const target=path.join(output,'ui',file);fs.copyFileSync(path.join(root,'ui',file),target);emitted.add(target);
  }
 }
 // Only prune the dedicated compiler output, after both compilations succeed.
 function prune(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
   const file=path.join(directory,entry.name);
   if(entry.isDirectory())prune(file);else if(!emitted.has(file))fs.unlinkSync(file);
  }
 }
 prune(output);
 return output;
}

function watchApp(onCompiled){
 let timer;
 const watchers=['ui','lib','electron','shared','types'].map(folder=>fs.watch(path.join(root,folder),{recursive:true},()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>{
   try{compileApp();onCompiled();}catch(error){console.error(error.message);}
  },180);
 }));
 return {close(){clearTimeout(timer);for(const watcher of watchers)watcher.close();}};
}
if(require.main===module){try{console.log('Development output: '+compileApp());}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={compileApp,watchApp};
