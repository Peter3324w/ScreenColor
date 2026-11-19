import { contextBridge,ipcRenderer,type IpcRendererEvent } from 'electron';
import { parseSnapshot,parseActionResult } from '../shared/ipc';
import type { ScreenColorAPI,ScreenColorSnapshot } from '../shared/types';
const api: ScreenColorAPI={
  getState:async()=>parseSnapshot(await ipcRenderer.invoke('screen-color:state') as unknown),
  action:async(...[type,payload])=>parseActionResult(await ipcRenderer.invoke('screen-color:action',type,payload) as unknown),
  subscribe:listener=>{
    const handler=(_event: IpcRendererEvent,input: unknown)=>{
      let state: ScreenColorSnapshot;try{state=parseSnapshot(input);}catch{return;}listener(state);
    };
    ipcRenderer.on('screen-color:update',handler);return ()=>{ipcRenderer.removeListener('screen-color:update',handler);};
  }
};
contextBridge.exposeInMainWorld('screenColor',api);
