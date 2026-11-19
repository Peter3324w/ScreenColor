const {test}=require('node:test');const assert=require('node:assert/strict');const {popupBounds}=require('../out/lib/popup.cjs');
test('popup fits above a bottom tray and below a top tray',()=>{
 const area={x:0,y:0,width:1920,height:1040};const bottom=popupBounds({x:1810,y:1040,width:24,height:40},area);assert.ok(bottom.y+bottom.height<=1040);assert.ok(bottom.x+bottom.width<=1920);assert.equal(bottom.width,364);
 const top=popupBounds({x:30,y:0,width:24,height:32},{x:0,y:32,width:1920,height:1048});assert.ok(top.y>=32);
});
test('popup respects negative display coordinates, small work areas and missing tray bounds',()=>{
 for(const area of [{x:-1280,y:-120,width:1280,height:720},{x:0,y:0,width:320,height:420}]){
  const bounds=popupBounds({x:0,y:0,width:0,height:0},area);assert.ok(bounds.x>=area.x);assert.ok(bounds.y>=area.y);assert.ok(bounds.x+bounds.width<=area.x+area.width);assert.ok(bounds.y+bounds.height<=area.y+area.height);
 }
});
