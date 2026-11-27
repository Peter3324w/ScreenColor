'use strict';
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const {compileApp,watchApp}=require('./compile-app.cjs');
compileApp();
const root=path.join(__dirname,'..','out','ui'),clients=new Set();
const server=http.createServer((req,res)=>{
 if(req.headers.host&&!/^localhost:\d+$/.test(req.headers.host)){res.writeHead(403);return res.end();}
 if(req.url==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
 if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({app:'screen-color',previewOnly:true}));}
 const requestPath=req.url?.split('?')[0],isMap=requestPath?.endsWith('.js.map');
 let file=({'/':'index.html','/index.html':'index.html','/app.js':'app.js','/experience.js':'experience.js','/experience.css':'experience.css','/filter-presets.js':'filter-presets.js','/style.css':'style.css','/popup.html':'popup.html','/popup.css':'popup.css','/popup.js':'popup.js','/playtime-tokens.css':'playtime-tokens.css','/playtime-appearance.js':'playtime-appearance.js','/icons.js':'icons.js','/appearance.js':'appearance.js','/customise.js':'customise.js','/mascot.js':'mascot.js','/color-matrix.js':'color-matrix.js','/image-preview.js':'image-preview.js','/preview-default.jpg':'preview-default.jpg'})[isMap?requestPath.slice(0,-4):requestPath];
 if(isMap&&file)file+='.map';
 if(!file){res.writeHead(404);return res.end('Not found');}res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',isMap?'application/json':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');const stream=fs.createReadStream(path.join(root,file));stream.on('error',()=>{res.statusCode=404;res.end('Not found');});stream.pipe(res);
});
let port=3000;server.on('error',error=>{if(error.code==='EADDRINUSE'&&port<3010)server.listen(++port,'localhost');else{console.error(error);process.exitCode=1;}});
server.on('listening',()=>console.log(`Screen Color UI preview: http://localhost:${port} (desktop processing requires Electron)`));server.listen(port,'localhost');
const watcher=watchApp(()=>{for(const client of clients)client.write('data: reload\n\n');});
process.on('SIGINT',()=>{watcher.close();for(const client of clients)client.end();server.close();});
