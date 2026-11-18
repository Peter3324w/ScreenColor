'use strict';
const path=require('node:path');
const unquote=value=>String(value).replace(/^"(.*)"$/,'$1');
const quote=value=>'"'+unquote(value)+'"';
function startupOptions({packaged,executable,root}){return {path:quote(executable),args:packaged?['--background']:[quote(root),'--background'],name:'Screen Color'};}
function runtimePaths({packaged,root,resources,userData}){return {native:packaged?path.join(resources,'native','ColorHost.exe'):path.join(root,'native','bin','ColorHost.exe'),diagnostics:packaged?path.join(userData,'logs'):path.join(root,'.local')};}
module.exports={startupOptions,runtimePaths};
