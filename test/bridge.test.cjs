const {test}=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');const {PassThrough}=require('node:stream');const {NativeBridge}=require('../lib/bridge.cjs');
function fakeChild(){const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new PassThrough();child.kill=()=>{child.exitCode=1;child.emit('close',1);};child.exitCode=null;return child;}
test('a failed executable launch can retry successfully',async()=>{
 let attempts=0;const bridge=new NativeBridge('host','data',{timeoutMs:100,spawn(){const child=fakeChild();attempts++;setImmediate(()=>{if(attempts===1){child.emit('error',new Error('ENOENT'));child.emit('close',-2);}else child.stdout.write('{"id":0,"ok":true}\n');});return child;}});bridge.on('failure',()=>{});
 await assert.rejects(bridge.start(),/ENOENT/);await bridge.start();assert.equal(attempts,2);bridge.closing=true;bridge.child.kill();
});
