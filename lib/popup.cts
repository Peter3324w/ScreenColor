export interface Rectangle { x: number; y: number; width: number; height: number }
export function popupBounds(anchor: Rectangle|null|undefined,area: Rectangle,size={width:364,height:548}): Rectangle {
  const gap=8,width=Math.min(size.width,Math.max(1,area.width-gap*2)),height=Math.min(size.height,Math.max(1,area.height-gap*2));
  const hasAnchor=anchor&&anchor.width>0&&anchor.height>0;
  const clamp=(n: number,min: number,max: number): number=>Math.round(Math.max(min,Math.min(max,n)));
  const x=hasAnchor?anchor.x+anchor.width/2-width/2:area.x+area.width-width-gap;
  const y=hasAnchor?(anchor.y<area.y+area.height/2?anchor.y+anchor.height+gap:anchor.y-height-gap):area.y+area.height-height-gap;
  return {x:clamp(x,area.x+gap,area.x+area.width-width-gap),y:clamp(y,area.y+gap,area.y+area.height-height-gap),width,height};
}
