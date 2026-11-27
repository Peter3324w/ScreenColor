'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {validateWindowColors,loadWindowColors,saveWindowColors,DEFAULT_WINDOW_COLORS}=require('../out/lib/window-colors.cjs');
test('window colors accept only two six-digit hex grounds',()=>{
 assert.deepEqual(validateWindowColors({background:'#F4F4F1',surface:'#fbfbf9'}),{background:'#f4f4f1',surface:'#fbfbf9'});
 for(const value of [null,{},{background:'#fff',surface:'#ffffff'},{background:'red',surface:'#ffffff'},{background:'#ffffff'},{background:'#ffffff',surface:'#ffffff',extra:1},{background:'#ffffff;x',surface:'#ffffff'}])assert.throws(()=>validateWindowColors(value),/Invalid window colors/);
});
test('window colors round-trip on disk and fall back to black when missing or malformed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'screen-color-')),file=path.join(dir,'window-colors.json');
 assert.deepEqual(loadWindowColors(file),DEFAULT_WINDOW_COLORS);
 saveWindowColors(file,{background:'#f4f4f1',surface:'#fbfbf9'});assert.deepEqual(loadWindowColors(file),{background:'#f4f4f1',surface:'#fbfbf9'});
 fs.writeFileSync(file,'{not json');assert.deepEqual(loadWindowColors(file),DEFAULT_WINDOW_COLORS);
 fs.rmSync(dir,{recursive:true,force:true});
});
