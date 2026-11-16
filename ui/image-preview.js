'use strict';
window.ImagePreview=(()=>{
 const image=document.querySelector('#preview-image'),fileInput=document.querySelector('#preview-file'),name=document.querySelector('#preview-image-name'),error=document.querySelector('#image-preview-error');
 const reset=document.querySelector('#default-image');let dbPromise,selection=0;
 function database(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('screen-color-preview',1);request.onupgradeneeded=()=>request.result.createObjectStore('images');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}));}
 async function stored(mode,value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('images',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('images');const request=mode==='get'?store.get('selected'):mode==='delete'?store.delete('selected'):store.put(value,'selected');tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Image storage failed.'));});}
 function read(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('This image could not be read.'));reader.readAsDataURL(file);});}
 function message(text){error.textContent=text;error.hidden=!text;}
 async function show(file,label,token){const source=await read(file);const probe=new Image();probe.src=source;await probe.decode();if(probe.naturalWidth*probe.naturalHeight>40000000)throw new Error('Choose an image smaller than 40 megapixels.');if(token!==selection)return false;image.src=source;image.alt='Color preview: '+label;name.textContent=label;reset.hidden=false;return true;}
 document.querySelector('#choose-image').addEventListener('click',()=>fileInput.click());
 fileInput.addEventListener('change',async()=>{const file=fileInput.files[0];if(!file)return;const token=++selection;message('');try{
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Choose a JPG, PNG, WebP or AVIF image.');if(file.size>20*1024*1024)throw new Error('Choose an image smaller than 20 MB.');
  if(await show(file,file.name,token)){try{await stored('put',{file,name:file.name});}catch{message('Image loaded for this session. It could not be saved on this device.');}}
 }catch(e){message(e.message);}finally{fileInput.value='';}});
 reset.addEventListener('click',async()=>{selection++;image.src='preview-default.jpg';image.alt='Wallpaper preview for comparing purple, green and orange colors';name.textContent='Your wallpaper';reset.hidden=true;message('');try{await stored('delete');}catch{message('Wallpaper restored. The saved image could not be cleared.');}});
 const initialSelection=selection;stored('get').then(async saved=>{if(saved&&initialSelection===selection)await show(saved.file,saved.name,initialSelection);}).catch(()=>{});
 image.addEventListener('error',()=>message('Preview image could not be loaded. Choose another image.'));
 return {update(values,enabled,desktop){document.querySelector('#image-color-matrix').setAttribute('values',window.ColorPreview.svgMatrix(values));image.classList.toggle('simulate-preview',window.ColorPreview.shouldSimulate(desktop,enabled));document.querySelector('#preview-original').setAttribute('aria-pressed',String(!enabled));document.querySelector('#preview-adjusted').setAttribute('aria-pressed',String(!!enabled));document.querySelector('#preview-badge').textContent=enabled?'Adjusted':'Original';document.querySelector('#image-preview-description').textContent=desktop?'Shows your live desktop colors.':'Image preview only. Your desktop is unchanged.';}};
})();
