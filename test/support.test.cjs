'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {supportURL}=require('../out/lib/support.cjs');
test('support destinations resolve to fixed app-specific HTTPS pages',()=>{
 assert.equal(supportURL('help'),'https://peters-cave.vercel.app/help-me');
 assert.equal(supportURL('apps'),'https://peters-cave.vercel.app/');
 assert.equal(supportURL('feedback'),'https://peters-cave.vercel.app/feedback?app=screen-color');
 const issues=new URL(supportURL('issues'));assert.equal(issues.origin,'https://github.com');assert.equal(issues.pathname,'/Peter3324w/app-feedback/issues');assert.match(issues.searchParams.get('q'),/\[Screen Color\]/);
});
test('external opening rejects arbitrary URLs and malformed destination IDs',()=>{
 for(const value of ['https://evil.example','file:///C:/Windows','javascript:alert(1)','__proto__','constructor','toString','',null,{},['help']])assert.throws(()=>supportURL(value),/Unknown support destination/);
});
