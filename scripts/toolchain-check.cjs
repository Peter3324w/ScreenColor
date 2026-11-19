'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto'),http=require('node:http'),vm=require('node:vm');
const {compileApp}=require('./compile-app.cjs');
const root=path.resolve(__dirname,'..'),url=process.env.SCREEN_COLOR_PREVIEW_URL||'http://localhost:3000';
function sources(){
 return Object.fromEntries(['lib','electron','ui','shared','types'].flatMap(folder=>fs.readdirSync(path.join(root,folder)).map(name=>{
  const file=path.join(folder,name);return [file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')];
 })));
}
function nextReload(change){
 return new Promise((resolve,reject)=>{
  let response,changed=false,buffer='';
  const timer=setTimeout(()=>finish(new Error('No compiled renderer reload received.')),20000);
  const request=http.get(url+'/events',res=>{
   response=res;res.on('data',chunk=>{
    buffer+=chunk;
    if(!changed&&buffer.includes(': connected')){changed=true;change();}
    if(buffer.includes('data: reload'))finish();
   });
   res.on('error',finish);
  });
  request.on('error',finish);
  function finish(error){clearTimeout(timer);response?.destroy();request.destroy();error?reject(error):resolve();}
 });
}
(async()=>{
 const before=sources();compileApp();assert.deepEqual(sources(),before,'Compilation must never alter source');
 for(const file of ['lib/values.cjs','ui/app.js']){
  const map=JSON.parse(fs.readFileSync(path.join(root,'out',file+'.map'),'utf8'));
  const source=path.resolve(root,'out',path.dirname(file),map.sources[0]);
  assert.ok(source.startsWith(root+path.sep)&&!source.startsWith(path.join(root,'out')+path.sep));
  assert.equal(map.sourcesContent[0],fs.readFileSync(source,'utf8'));
 }
 const response=await fetch(url+'/app.js.map');assert.equal(response.status,200,'Browser source maps must be served');
 assert.equal((await response.json()).sourcesContent[0],fs.readFileSync(path.join(root,'ui','app.js'),'utf8'));
 const probe=path.join(root,'ui','__migration-check.ts');assert.ok(!fs.existsSync(probe),'Never overwrite an existing probe file');
 try{
  await nextReload(()=>fs.writeFileSync(probe,'const screenColorCompilerProbe: number = 314;\n'));
  const emitted=fs.readFileSync(path.join(root,'out','ui','__migration-check.js'),'utf8');
  assert.equal(vm.runInNewContext(emitted+'\nscreenColorCompilerProbe;'),314,'Browser output must work without Node globals');
  await nextReload(()=>fs.unlinkSync(probe));
  assert.equal(fs.existsSync(path.join(root,'out','ui','__migration-check.js')),false,'Deleted sources must not leave runnable output');
  assert.equal(fs.existsSync(path.join(root,'out','ui','__migration-check.js.map')),false,'Deleted sources must not leave stale maps');
 }finally{
  for(const file of [probe,path.join(root,'out','ui','__migration-check.js'),path.join(root,'out','ui','__migration-check.js.map')])if(fs.existsSync(file))fs.unlinkSync(file);
 }
 assert.deepEqual(sources(),before);
 console.log('PASS: compilation preserves source; Node and browser maps resolve to original files with embedded source; localhost serves maps; typed browser edits compile and trigger reload without Node globals.');
})().catch(error=>{console.error(error);process.exitCode=1;});
