const {test}=require('node:test');const assert=require('node:assert/strict');const {startupOptions,runtimePaths}=require('../out/lib/platform.cjs');
test('installed startup launches the installed executable without a source-folder argument',()=>{
 assert.deepEqual(startupOptions({packaged:true,executable:'C:\\Apps\\Screen Color.exe',root:'C:\\Apps\\resources\\app.asar'}),{path:'"C:\\Apps\\Screen Color.exe"',args:['--background'],name:'Screen Color'});
 assert.deepEqual(startupOptions({packaged:false,executable:'electron.exe',root:'source'}).args,['"source"','--background']);
 assert.deepEqual(startupOptions({packaged:false,executable:'electron.exe',root:'C:\\My Apps\\ScreenColor'}).args,['"C:\\My Apps\\ScreenColor"','--background']);
});
test('installed native helper and writable diagnostics are outside the application archive',()=>{
 const p=runtimePaths({packaged:true,root:'archive',resources:'resources',userData:'userdata'});assert.ok(p.native.includes('resources'));assert.ok(!p.native.includes('archive'));assert.ok(p.diagnostics.includes('userdata'));assert.ok(!p.diagnostics.includes('archive'));
});
