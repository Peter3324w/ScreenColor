import {query as $,message as errorMessage} from './dom';
import {object} from '../lib/validation.cjs';
import {svgMatrix,shouldSimulate} from '../shared/color-matrix';
import type {ColorValues} from '../shared/types';
interface ImageRecord {file: Blob;name: string}
window.ImagePreview=(()=>{
  const image=$<HTMLImageElement>('#preview-image'),fileInput=$<HTMLInputElement>('#preview-file'),name=$('#preview-image-name'),error=$('#image-preview-error');
  const reset=$<HTMLButtonElement>('#default-image');let dbPromise: Promise<IDBDatabase>|undefined,selection=0;
  function database(): Promise<IDBDatabase> {
    return dbPromise||(dbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open('screen-color-preview',1);request.onupgradeneeded=()=>request.result.createObjectStore('images');
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    }));
  }
  async function stored(mode: 'get'|'put'|'delete',value?: ImageRecord): Promise<unknown> {
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('images',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('images');
      const request=mode==='get'?store.get('selected'):mode==='delete'?store.delete('selected'):store.put(value,'selected');
      tx.oncomplete=()=>resolve(request.result as unknown);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Image storage failed.'));
    });
  }
  function read(file: Blob): Promise<string> {
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('This image could not be read.'));
      reader.onerror=()=>reject(new Error('This image could not be read.'));reader.readAsDataURL(file);
    });
  }
  function message(text: string): void {error.textContent=text;error.hidden=!text;}
  async function show(file: Blob,label: string,token: number): Promise<boolean> {
    const source=await read(file),probe=new Image();probe.src=source;await probe.decode();
    if(probe.naturalWidth*probe.naturalHeight>40000000)throw new Error('Choose an image smaller than 40 megapixels.');
    if(token!==selection)return false;image.src=source;image.alt='Color preview: '+label;name.textContent=label;reset.hidden=false;return true;
  }
  $<HTMLButtonElement>('#choose-image').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];if(!file)return;const token=++selection;message('');
    try{
      if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Choose a JPG, PNG, WebP or AVIF image.');
      if(file.size>20*1024*1024)throw new Error('Choose an image smaller than 20 MB.');
      if(await show(file,file.name,token)){try{await stored('put',{file,name:file.name});}catch{message('Image loaded for this session. It could not be saved on this device.');}}
    }catch(error){message(errorMessage(error));}finally{fileInput.value='';}
  });
  reset.addEventListener('click',async()=>{
    selection++;image.src='preview-default.jpg';image.alt='Wallpaper preview for comparing purple, green and orange colors';name.textContent='Your wallpaper';reset.hidden=true;message('');
    try{await stored('delete');}catch{message('Wallpaper restored. The saved image could not be cleared.');}
  });
  const initialSelection=selection;
  stored('get').then(async saved=>{if(object(saved)&&saved.file instanceof Blob&&typeof saved.name==='string'&&initialSelection===selection)await show(saved.file,saved.name,initialSelection);}).catch(()=>{});
  image.addEventListener('error',()=>message('Preview image could not be loaded. Choose another image.'));
  return {update(values: ColorValues,enabled: boolean,desktop: boolean){
    $<SVGFEColorMatrixElement>('#image-color-matrix').setAttribute('values',svgMatrix(values));image.classList.toggle('simulate-preview',shouldSimulate(desktop,enabled));
    $<HTMLButtonElement>('#preview-original').setAttribute('aria-pressed',String(!enabled));$<HTMLButtonElement>('#preview-adjusted').setAttribute('aria-pressed',String(!!enabled));
    $('#preview-badge').textContent=enabled?'Adjusted':'Original';$('#image-preview-description').textContent=desktop?'Shows your live desktop colors.':'Image preview only. Your desktop is unchanged.';
  }};
})();
