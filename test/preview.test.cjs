const {test}=require('node:test');const assert=require('node:assert/strict');
const {colorMatrix,svgMatrix,shouldSimulate}=require('../ui/color-matrix.js');const {DEFAULT_VALUES,REFERENCE,matrix}=require('../lib/model.cjs');
test('preview matrix matches the native-domain transform and transposes SVG channel order',()=>{
 assert.deepEqual(colorMatrix(REFERENCE),matrix(REFERENCE));
 const actual=svgMatrix(REFERENCE).split(' ').map(Number);assert.equal(actual.length,20);
 const native=matrix(REFERENCE);for(let out=0;out<4;out++)for(let input=0;input<5;input++)assert.ok(Math.abs(actual[out*5+input]-native[input*5+out])<1e-6);
 assert.equal(svgMatrix(DEFAULT_VALUES),'1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
});
test('only browser previews simulate the enabled effect, avoiding double processing in Electron',()=>{
 assert.equal(shouldSimulate(false,true),true);assert.equal(shouldSimulate(false,false),false);assert.equal(shouldSimulate(true,true),false);assert.equal(shouldSimulate(true,false),false);
});
