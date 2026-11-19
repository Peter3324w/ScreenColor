const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const matrix=require('../out/shared/color-matrix.js'),filters=require('../out/shared/filter-presets.cjs');
const {DEFAULT_VALUES,REFERENCE}=require('../out/lib/model.cjs');
function browser(file){const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../out/ui',file),'utf8'),context);return context;}
test('the browser matrix bundle runs without Node and matches the native-domain transform',()=>{
 const {ColorPreview}=browser('color-matrix.js');
 assert.deepEqual(Array.from(ColorPreview.colorMatrix(DEFAULT_VALUES)),[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1]);
 assert.deepEqual(Array.from(ColorPreview.colorMatrix(REFERENCE)),matrix.colorMatrix(REFERENCE));
 assert.equal(ColorPreview.svgMatrix(REFERENCE),matrix.svgMatrix(REFERENCE));
 assert.equal(ColorPreview.shouldSimulate(true,true),false);
});
test('the browser filter bundle preserves the shared catalog and immutable values without Node',()=>{
 const {ScreenColorFilters}=browser('filter-presets.js');
 assert.deepEqual(JSON.parse(JSON.stringify(ScreenColorFilters)),filters);
 assert.ok(Object.isFrozen(ScreenColorFilters));
 for(const filter of ScreenColorFilters)assert.ok(Object.isFrozen(filter)&&Object.isFrozen(filter.values));
});
