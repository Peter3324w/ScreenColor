'use strict';
const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');const source=path.join(root,'native','ColorHost.cs');const output=path.join(root,'native','bin','ColorHost.exe');
function compile(){
 fs.mkdirSync(path.dirname(output),{recursive:true});
 if(fs.existsSync(output)&&fs.statSync(output).mtimeMs>=fs.statSync(source).mtimeMs)return output;
 const compiler=path.join(process.env.WINDIR||'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe');
 const result=spawnSync(compiler,['/nologo','/target:exe','/platform:x64','/reference:System.Web.Extensions.dll',`/out:${output}`,source],{encoding:'utf8',windowsHide:true});
 if(result.error||result.status!==0)throw new Error(result.error?.message||result.stdout||result.stderr||'Native compilation failed.');return output;
}
if(require.main===module){try{console.log(compile());}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={compile};
