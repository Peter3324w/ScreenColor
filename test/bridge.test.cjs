const {test}=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');const {PassThrough}=require('node:stream');const {NativeBridge}=require('../out/lib/bridge.cjs');
function fakeChild(){const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new PassThrough();child.kill=()=>{child.exitCode=1;child.emit('close',1);};child.exitCode=null;return child;}
test('a failed executable launch can retry successfully',async()=>{
 let attempts=0;const bridge=new NativeBridge('host','data',{timeoutMs:5000,spawn(){const child=fakeChild();attempts++;setImmediate(()=>{if(attempts===1){child.emit('error',new Error('ENOENT'));child.emit('close',-2);}else child.stdout.write('{"id":0,"ok":true}\n');});return child;}});bridge.on('failure',()=>{});
 await assert.rejects(bridge.start(),/ENOENT/);await bridge.start();assert.equal(attempts,2);bridge.closing=true;bridge.child.kill();
});
test('startup error survives child exit and is reported only once',async()=>{
 const child=fakeChild(),failures=[];const bridge=new NativeBridge('host','data',{timeoutMs:5000,spawn(){setImmediate(()=>{child.stdout.write('{"id":0,"ok":false,"error":"Close the old experiment first."}\n');child.emit('close',1);});return child;}});bridge.on('failure',e=>failures.push(e.message));
 await assert.rejects(bridge.start(),/Close the old experiment/);assert.deepEqual(failures,['Close the old experiment first.']);
});
test('retry after a rejected handshake does not reuse the unready child',async()=>{
 const children=[];const bridge=new NativeBridge('host','data',{timeoutMs:5000,spawn(){const child=fakeChild();children.push(child);setImmediate(()=>child.stdout.write(children.length===1?'{"id":0,"ok":false,"error":"Temporarily unavailable"}\n':'{"id":0,"ok":true}\n'));return child;}});bridge.on('failure',()=>{});
 await assert.rejects(bridge.start(),/Temporarily/);await bridge.start();assert.equal(children.length,2);bridge.closing=true;bridge.child.kill();
});

test('native handshake rejects malformed data instead of treating truthy flags as success',async()=>{
 for(const payload of ['{"id":0,"ok":"true"}','null','[]','{"id":"0","ok":true}','{"id":-1,"ok":true}','{"id":0,"ok":false,"error":42}']){
  const child=fakeChild(),failures=[];
  const bridge=new NativeBridge('host','data',{timeoutMs:100,spawn(){setImmediate(()=>child.stdout.write(payload+'\n'));return child;}});
  bridge.on('failure',error=>failures.push(error.message));
  await assert.rejects(bridge.start(),/Invalid color-engine response/);
  assert.equal(bridge.ready,false);assert.equal(bridge.child,null);assert.equal(failures.length,1);
 }
});

test('a malformed native reply rejects pending work and allows a fresh connection',async()=>{
 const children=[];
 const bridge=new NativeBridge('host','data',{timeoutMs:100,spawn(){const child=fakeChild();children.push(child);setImmediate(()=>child.stdout.write('{"id":0,"ok":true}\n'));return child;}});
 bridge.on('failure',()=>{});await bridge.start();
 const pending=bridge.request({command:'reset'});
 children[0].stdout.write('{"id":1,"ok":"true"}\n');
 await assert.rejects(pending,/Invalid color-engine response/);assert.equal(bridge.pending.size,0);assert.equal(bridge.ready,false);
 await bridge.start();assert.equal(children.length,2);bridge.closing=true;bridge.child.kill();
});
