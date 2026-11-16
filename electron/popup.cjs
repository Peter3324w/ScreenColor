'use strict';
const {BrowserWindow,screen}=require('electron');const path=require('node:path');const {pathToFileURL}=require('node:url');const {popupBounds}=require('../lib/popup.cjs');
class Popup{
 constructor(root,onState){
  this.pinned=false;this.trayBounds=null;this.url=pathToFileURL(path.join(root,'ui/popup.html')).href;
  this.window=new BrowserWindow({width:364,height:548,show:false,frame:false,resizable:false,maximizable:false,minimizable:false,skipTaskbar:true,alwaysOnTop:true,title:'Screen Color quick controls',backgroundColor:'#000000',webPreferences:{preload:path.join(root,'electron/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  this.window.webContents.setWindowOpenHandler(()=>({action:'deny'}));this.window.webContents.on('will-navigate',(event,url)=>{if(url!==this.url)event.preventDefault();});
  this.window.on('close',event=>{event.preventDefault();this.hide();});
  this.window.on('blur',()=>{clearTimeout(this.blurTimer);this.blurTimer=setTimeout(()=>{if(!this.pinned&&!this.window.isDestroyed()&&!this.window.isFocused())this.hide();},160);});
  this.ready=this.window.loadURL(this.url);this.onState=onState;
 }
 async show(bounds){await this.ready;if(bounds)this.trayBounds=bounds;const anchor=this.trayBounds;const display=screen.getDisplayNearestPoint(anchor&&anchor.width?{x:Math.round(anchor.x+anchor.width/2),y:Math.round(anchor.y+anchor.height/2)}:screen.getCursorScreenPoint());
  this.window.setBounds(popupBounds(anchor,display.workArea));this.window.setAlwaysOnTop(true);this.window.show();this.window.focus();this.onState();
 }
 hide(){clearTimeout(this.blurTimer);if(!this.window.isDestroyed())this.window.hide();}
 setPinned(pinned){this.pinned=pinned;clearTimeout(this.blurTimer);this.window.setAlwaysOnTop(true);this.onState();}
}
module.exports={Popup};
