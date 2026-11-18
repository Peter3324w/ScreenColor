'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {StartupRegistration,WindowsRegistry}=require('../lib/startup.cjs');
const options={name:'Screen Color',path:'"C:\\Apps\\Screen Color.exe"',args:['--background']};
function fixture(initial){let value=structuredClone(initial);return {registry:{read:()=>structuredClone(value),write:next=>{value=structuredClone(next);}},read:()=>value};}
test('legacy unquoted command is repaired without changing Windows-disabled approval',()=>{
 const old={command:'C:\\Apps\\Screen Color.exe --background',approval:'030000000000000000000000'};const f=fixture(old),registration=new StartupRegistration(options,f.registry);registration.repairLegacy();assert.equal(f.read().command,'"C:\\Apps\\Screen Color.exe" --background');assert.equal(f.read().approval,old.approval);assert.deepEqual(registration.status(),{registered:true,enabled:false});
});
test('explicit startup change rolls back exact command and disabled approval after preference save failure',async()=>{
 const old={command:'"C:\\Apps\\Screen Color.exe" --background',approval:'030000000000000000000000'};const f=fixture(old),registration=new StartupRegistration(options,f.registry);await assert.rejects(registration.set(true,async()=>{throw new Error('Disk full');}),/Disk full/);assert.deepEqual(f.read(),old);
});
test('startup mutation verifies actual registry and explicit disable removes only its own command',async()=>{
 const f=fixture({command:null,approval:null}),registration=new StartupRegistration(options,f.registry);await registration.set(true,async()=>{});assert.equal(registration.status().enabled,true);await registration.set(false,async()=>{});assert.deepEqual(f.read(),{command:null,approval:null});
 const broken=new StartupRegistration(options,{read:()=>({command:null,approval:null}),write:()=>{}});await assert.rejects(broken.set(true,async()=>{}),/confirm/);
});
test('a failed older startup transaction cannot roll back a newer successful change',async()=>{
 const f=fixture({command:null,approval:null}),registration=new StartupRegistration(options,f.registry);let rejectFirst,started;const firstStarted=new Promise(resolve=>started=resolve);
 const first=registration.set(true,()=>{started();return new Promise((_,reject)=>rejectFirst=reject);});const firstFailure=assert.rejects(first,/first failed/);await firstStarted;
 const second=registration.set(true,async()=>{});rejectFirst(new Error('first failed'));await firstFailure;await second;assert.equal(registration.status().enabled,true);
});
test('missing registry values are detected without English error text while access denied remains an error',()=>{
 const missing=Object.assign(new Error('El sistema no encuentra el valor especificado'),{status:1,stderr:'No se ha encontrado'});
 const registry=new WindowsRegistry('Screen Color Test');registry.run=args=>{if(args.includes('/v'))throw missing;return '';};assert.deepEqual(registry.read(),{command:null,approval:null});registry.put('HKCU\\Test','REG_SZ',null);
 const denied=Object.assign(new Error('Zugriff verweigert'),{status:1,stderr:'Zugriff verweigert'});registry.run=args=>{if(args.includes('/v')||args[1].endsWith('\\Test'))throw denied;return 'HKEY_CURRENT_USER\\Test\n';};assert.throws(()=>registry.value('HKCU\\Test','REG_SZ'),/Zugriff/);
});
