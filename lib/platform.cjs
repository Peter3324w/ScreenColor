'use strict';
const path=require('node:path');
function startupOptions({packaged,executable,root}){return {path:executable,args:packaged?['--background']:[root,'--background'],name:'Screen Color'};}
function runtimePaths({packaged,root,resources,userData}){return {native:packaged?path.join(resources,'native','ColorHost.exe'):path.join(root,'native','bin','ColorHost.exe'),diagnostics:packaged?path.join(userData,'logs'):path.join(root,'.local')};}
module.exports={startupOptions,runtimePaths};
