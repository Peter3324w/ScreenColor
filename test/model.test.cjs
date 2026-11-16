const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DEFAULT_VALUES,REFERENCE,LIMITS,validateValues,matrix,defaultState,validateState}=require('../lib/model.cjs');
test('neutral matrix is identity and reference retains the approved strengths',()=>{
 const m=matrix(DEFAULT_VALUES); assert.equal(m.length,25);
 for(let i=0;i<25;i++) assert.ok(Math.abs(m[i]-(i%6===0?1:0))<1e-8);
 assert.deepEqual(REFERENCE,{saturation:139,contrast:115,warmth:100,brightness:100,tint:0});
});
test('strict values reject nonfinite, missing, out of range and extra fields',()=>{
 for(const bad of [{...DEFAULT_VALUES,saturation:201},{...DEFAULT_VALUES,tint:NaN},{...DEFAULT_VALUES,gamma:2},{saturation:100},null]) assert.throws(()=>validateValues(bad));
 assert.deepEqual(validateValues({...DEFAULT_VALUES,saturation:0,warmth:-300,contrast:140}),{...DEFAULT_VALUES,saturation:0,warmth:-300,contrast:140});
 assert.deepEqual(LIMITS.warmth,[-300,300]);
});
test('saturation preserves neutral grays and channel coefficients remain finite at limits',()=>{
 const m=matrix({...DEFAULT_VALUES,saturation:200});
 for(let j=0;j<3;j++)assert.ok(Math.abs(m[j]+m[5+j]+m[10+j]-1)<1e-7);
 for(const warmth of [-300,300])assert.ok(matrix({...REFERENCE,warmth,contrast:140,tint:100,brightness:120}).every(Number.isFinite));
});
test('state validates complete saved profiles and starts with effect off',()=>{
 const state=defaultState(); assert.equal(state.enabled,false);assert.equal(state.preferences.startup,false);
 assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))),state);
 assert.throws(()=>validateState({...state,version:99}));
 assert.throws(()=>validateState({...state,enabled:'true'}));
 assert.throws(()=>validateState({...state,profiles:[{id:'neutral',name:'bad',values:DEFAULT_VALUES}]}));
});
