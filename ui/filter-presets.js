(function(root,factory){const presets=factory();if(typeof module==='object'&&module.exports)module.exports=presets;else root.ScreenColorFilters=presets;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const neutral={saturation:100,contrast:100,warmth:0,brightness:100,tint:0};
 const definitions=[
  ['natural','Natural','A gentle lift for everyday colors.',{saturation:108,contrast:103}],
  ['vivid','Vivid','Richer color with a little more punch.',{saturation:125,contrast:110,warmth:10}],
  ['golden','Golden','A warm, sunlit feel.',{saturation:110,contrast:103,warmth:130,brightness:102,tint:5}],
  ['cool','Cool','Crisp color with cooler tones.',{saturation:106,contrast:105,warmth:-110}],
  ['soft','Soft','Gentler contrast and quieter color.',{saturation:92,contrast:91,warmth:25,brightness:103,tint:3}],
  ['cinema','Cinema','Muted color, deeper contrast.',{saturation:88,contrast:117,warmth:-35,brightness:96,tint:7}],
  ['vintage','Vintage','Faded color with a warm cast.',{saturation:78,contrast:92,warmth:105,tint:8}],
  ['mono','Mono','Black and white with extra depth.',{saturation:0,contrast:110}]
 ];
 return Object.freeze(definitions.map(([id,name,description,values])=>Object.freeze({id:'filter-'+id,name,description,values:Object.freeze({...neutral,...values})})));
});
