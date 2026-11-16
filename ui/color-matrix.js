(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ColorPreview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function colorMatrix(v){
  const s=v.saturation/100,c=v.contrast/100,w=v.warmth/100,b=v.brightness/100,t=v.tint/100;
  const gain=[(1-Math.max(0,-w)*.08)*(1-Math.max(0,-t)*.1),1-Math.abs(w)*.02-Math.max(0,t)*.12,(1-Math.max(0,w)*.08)*(1-Math.max(0,-t)*.1)];
  const weights=[.2126,.7152,.0722],m=Array(25).fill(0);m[18]=m[24]=1;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)m[i*5+j]=((1-s)*weights[i]+(i===j?s:0))*c*gain[j]*b;
  for(let j=0;j<3;j++)m[20+j]=.5*(1-c)*gain[j]*b;return m;
 }
 function svgMatrix(values){const m=colorMatrix(values),result=[];for(let output=0;output<4;output++)for(let input=0;input<5;input++)result.push(Number(m[input*5+output].toFixed(7)));return result.join(' ');}
 function shouldSimulate(desktop,enabled){return !desktop&&!!enabled;}
 return {colorMatrix,svgMatrix,shouldSimulate};
});
