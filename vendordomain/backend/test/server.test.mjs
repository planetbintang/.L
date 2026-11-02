import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

async function freePort(){
 const s=createServer();await new Promise((resolve,reject)=>s.listen(0,'127.0.0.1',resolve).once('error',reject));
 const p=s.address().port;await new Promise(resolve=>s.close(resolve));return p;
}
test('VendorDomain API security and persistent record flow',async(t)=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'vd-api-')),port=await freePort(),token='test-token-with-at-least-thirty-two-characters';
 const backendDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const child=spawn(process.execPath,['server.mjs'],{cwd:backendDir,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DATA_DIR:dir,ADMIN_TOKEN:token,ALLOWED_ORIGIN:'https://planetbintang.github.io',RATE_LIMIT_MAX:'100'},stdio:'ignore'});
 const base='http://127.0.0.1:'+port;
 t.after(async()=>{child.kill('SIGTERM');await rm(dir,{recursive:true,force:true});});
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch(base+'/health');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.equal(ready,true,'API should become ready');
 const health=await fetch(base+'/health');assert.equal((await health.json()).ok,true);
 const deniedOrigin=await fetch(base+'/health',{headers:{Origin:'https://attacker.example'}});assert.equal(deniedOrigin.status,403);
 const valid=await fetch(base+'/api/domain/validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({domain:'example.com'})});
 assert.equal((await valid.json()).valid,true);
 const unauthorized=await fetch(base+'/api/records');assert.equal(unauthorized.status,401);
 const headers={'content-type':'application/json',authorization:'Bearer '+token,origin:'https://planetbintang.github.io'};
 const created=await fetch(base+'/api/records',{method:'POST',headers,body:JSON.stringify({title:'Uji ekosistem',type:'test',data:{ok:true}})});
 assert.equal(created.status,201);const record=(await created.json()).record;assert.ok(record.id);
 const listed=await fetch(base+'/api/records',{headers:{authorization:headers.authorization}});
 assert.equal((await listed.json()).records.length,1);
 const audit=await fetch(base+'/api/audit',{headers:{authorization:headers.authorization}});
 assert.ok((await audit.json()).events.some(x=>x.action==='record.create'));
 const malformed=await fetch(base+'/api/records',{method:'POST',headers,body:'{'});
 assert.equal(malformed.status,400);
});
