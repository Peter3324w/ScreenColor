const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {findRuntime, findBuilder} = require('../scripts/runtime.cjs');

function fixture(t) {
 const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'screen-color-runtime-'));
 t.after(() => fs.rmSync(parent, {recursive:true, force:true}));
 const root = path.join(parent, 'ScreenColor');
 fs.mkdirSync(root);
 fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({devDependencies:{electron:'45.4.1', 'electron-builder':'26.18.0'}}));
 return {root, parent, env:{}};
}
function runtime(project, version) {
 const dist = path.join(project, 'node_modules', 'electron', 'dist');
 fs.mkdirSync(dist, {recursive:true});
 const executable = path.join(dist, 'electron.exe');
 fs.writeFileSync(executable, 'test fixture only');
 if (version !== null) fs.writeFileSync(path.join(dist, 'version'), version);
 return executable;
}
function builder(project, version) {
 const dir = path.join(project, 'node_modules', 'electron-builder');
 fs.mkdirSync(dir, {recursive:true});
 fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({version, main:'index.cjs'}));
 fs.writeFileSync(path.join(dir, 'index.cjs'), 'module.exports={fixture:true}');
 return dir;
}

test('runtime selection rejects unsupported neighboring runtimes', t => {
 const options = fixture(t);
 runtime(path.join(options.parent, 'Download-manager'), '33.4.11');
 assert.throws(() => findRuntime(options), /45\.4\.1.*33\.4\.11/s);
});
test('runtime selection accepts a pinned local runtime', t => {
 const options = fixture(t);
 const executable = runtime(options.root, '45.4.1\r\n');
 assert.equal(findRuntime(options), executable);
});
test('runtime selection skips a stale neighbor for a compatible neighbor', t => {
 const options = fixture(t);
 runtime(path.join(options.parent, 'Download-manager'), '33.4.11');
 const executable = runtime(path.join(options.parent, 'Playtime'), '45.4.1');
 assert.equal(findRuntime(options), executable);
});
test('runtime selection fails closed when version evidence is missing', t => {
 const options = fixture(t);
 runtime(options.root, null);
 assert.throws(() => findRuntime(options), /45\.4\.1.*(?:missing|unreadable)/s);
});
test('an explicit stale runtime override is rejected even with a compatible fallback', t => {
 const options = fixture(t);
 const stale = runtime(path.join(options.parent, 'Download-manager'), '33.4.11');
 runtime(options.root, '45.4.1');
 options.env.SCREEN_COLOR_ELECTRON = stale;
 assert.throws(() => findRuntime(options), /45\.4\.1.*33\.4\.11/s);
});
test('builder selection rejects a stale local builder', t => {
 const options = fixture(t);
 builder(options.root, '25.1.8');
 assert.throws(() => findBuilder(options), /26\.18\.0.*25\.1\.8/s);
});
test('builder selection rejects a matching neighboring builder with an independent dependency tree', t => {
 const options = fixture(t);
 builder(path.join(options.parent, 'Playtime'), '26.18.0');
 assert.throws(() => findBuilder(options), /26\.18\.0/);
});
test('builder selection accepts the pinned local builder without executing it', t => {
 const options = fixture(t);
 const dir = builder(options.root, '26.18.0');
 assert.equal(findBuilder(options), dir);
});
