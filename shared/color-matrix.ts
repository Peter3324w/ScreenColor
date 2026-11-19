import type { ColorValues } from './types';

export function colorMatrix(v: Readonly<ColorValues>): number[] {
  const s=v.saturation/100,c=v.contrast/100,w=v.warmth/100,b=v.brightness/100,t=v.tint/100;
  const gain=[(1-Math.max(0,-w)*.08)*(1-Math.max(0,-t)*.1),1-Math.abs(w)*.02-Math.max(0,t)*.12,(1-Math.max(0,w)*.08)*(1-Math.max(0,-t)*.1)];
  const weights=[.2126,.7152,.0722],m: number[]=Array<number>(25).fill(0);m[18]=m[24]=1;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)m[i*5+j]=((1-s)*weights[i]+(i===j?s:0))*c*gain[j]*b;
  for(let j=0;j<3;j++)m[20+j]=.5*(1-c)*gain[j]*b;return m;
}
export function svgMatrix(values: Readonly<ColorValues>): string {
  const m=colorMatrix(values),result: number[]=[];
  for(let output=0;output<4;output++)for(let input=0;input<5;input++)result.push(Number(m[input*5+output].toFixed(7)));
  return result.join(' ');
}
export function shouldSimulate(desktop: boolean,enabled: boolean): boolean { return !desktop&&!!enabled; }
