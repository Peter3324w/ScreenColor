import path = require('node:path');
export interface StartupOptions { path: string; args: string[]; name: string }
const unquote=(value: string): string=>String(value).replace(/^"(.*)"$/,'$1');
const quote=(value: string): string=>'"'+unquote(value)+'"';
export function startupOptions({packaged,executable,root}: {packaged: boolean; executable: string; root: string}): StartupOptions {
  return {path:quote(executable),args:packaged?['--background']:[quote(root),'--background'],name:'Screen Color'};
}
export function runtimePaths({packaged,root,resources,userData}: {packaged: boolean; root: string; resources: string; userData: string}): {native: string; diagnostics: string} {
  return {native:packaged?path.join(resources,'native','ColorHost.exe'):path.join(root,'native','bin','ColorHost.exe'),diagnostics:packaged?path.join(userData,'logs'):path.join(root,'.local')};
}
