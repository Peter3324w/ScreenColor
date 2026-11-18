'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {compareVersions,releaseUpdate,UpdateChecker}=require('../lib/updates.cjs');
const fixture=(version='0.2.0')=>({tag_name:'v'+version,name:'Screen Color '+version,draft:false,prerelease:false,html_url:'https://github.com/Peter3324w/ScreenColor/releases/tag/v'+version,assets:[{name:`Screen-Color-Setup-${version}-x64.exe`,size:123456,browser_download_url:`https://github.com/Peter3324w/ScreenColor/releases/download/v${version}/Screen-Color-Setup-${version}-x64.exe`}]});
test('stable versions compare numerically and update metadata has an exact trusted asset',()=>{
 assert.ok(compareVersions('0.10.0','0.9.9')>0);assert.equal(compareVersions('v0.1.1','0.1.1'),0);
 assert.equal(releaseUpdate(fixture(),'0.1.1').version,'0.2.0');assert.equal(releaseUpdate(fixture('0.1.1'),'0.1.1'),null);assert.equal(releaseUpdate(fixture('0.1.0'),'0.1.1'),null);
 for(const version of ['0.2','0.2.0-beta.1','01.2.0','0.2.0/evil','90071992547409999.0.0'])assert.equal(releaseUpdate(fixture(version),'0.1.1'),null);
});
test('release validator rejects drafts, prereleases, wrong repositories, credentials and mismatched files',()=>{
 for(const mutate of [r=>r.draft=true,r=>r.prerelease=true,r=>r.assets=[],r=>r.html_url='https://evil.example',r=>r.assets[0].browser_download_url='https://github.com.evil.example/file.exe',r=>r.assets[0].browser_download_url='https://user:pass@github.com/Peter3324w/ScreenColor/releases/download/v0.2.0/Screen-Color-Setup-0.2.0-x64.exe',r=>r.assets[0].name='Other.exe',r=>r.assets[0].size=0]){const value=fixture();mutate(value);assert.equal(releaseUpdate(value,'0.1.1'),null);}
});
test('checker coalesces requests, only fetches release JSON and preserves discovered update on offline failure',async()=>{
 let calls=0,offline=false;const checker=new UpdateChecker({current:'0.1.1',fetch:async(url)=>{calls++;assert.equal(url,'https://api.github.com/repos/Peter3324w/ScreenColor/releases/latest');if(offline)throw new Error('offline');await new Promise(r=>setTimeout(r,10));return new Response(JSON.stringify(fixture()));}});
 await Promise.all([checker.check(),checker.check()]);assert.equal(calls,1);assert.equal(checker.snapshot().available.version,'0.2.0');offline=true;await checker.check();assert.equal(checker.snapshot().available.version,'0.2.0');assert.equal(checker.snapshot().status,'error');
});
test('checker reports bounded-response, HTTP and JSON failures without exposing provider text',async()=>{
 for(const fetch of [async()=>new Response('private error',{status:403}),async()=>new Response('bad json'),async()=>new Response('x'.repeat(150000))]){const checker=new UpdateChecker({current:'0.1.1',fetch});await checker.check();assert.equal(checker.snapshot().status,'error');assert.equal(checker.snapshot().available,null);assert.doesNotMatch(checker.snapshot().error,/private error|bad json|xxxxx/);}
});
test('timeout cancels a slow check and a late response cannot overwrite its result',async()=>{
 const checker=new UpdateChecker({current:'0.1.1',timeoutMs:10,fetch:async()=>{await new Promise(r=>setTimeout(r,35));return new Response(JSON.stringify(fixture()));}});await checker.check();assert.equal(checker.snapshot().status,'error');await new Promise(r=>setTimeout(r,50));assert.equal(checker.snapshot().available,null);assert.equal(checker.snapshot().status,'error');
});
test('malformed successful responses never erase a previously validated update',async()=>{
 let bad=false;const checker=new UpdateChecker({current:'0.1.1',fetch:async()=>new Response(JSON.stringify(bad?{message:'unexpected'}:fixture()))});await checker.check();bad=true;await checker.check();assert.equal(checker.snapshot().status,'error');assert.equal(checker.snapshot().available.version,'0.2.0');
});
