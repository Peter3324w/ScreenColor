'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('screenColor',{
 getState:()=>ipcRenderer.invoke('screen-color:state'),
 action:(type,payload)=>ipcRenderer.invoke('screen-color:action',type,payload),
 subscribe:listener=>{const handler=(_event,state)=>listener(state);ipcRenderer.on('screen-color:update',handler);return ()=>ipcRenderer.removeListener('screen-color:update',handler);}
});
