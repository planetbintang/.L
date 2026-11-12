import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

async function freePort(){const s=createServer();await new Promise((resolve,reject)=>s.listen(0,'127.0.0.1',resolve).once('error',reject));const p=s.address().port;await new Promise(resolve=>s.close(resolve));return p;}
test('VendorDomain account registration, tenant isolation and profile flow',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'vd-account-')),port=await freePort(),backendDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const child=spawn(process.execPath,['server.mjs'],{cwd:backendDir,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DATA_DIR:dir,ADMIN_TOKEN:'account-test-admin-token-long-enough-32-chars',ALLOWED_ORIGIN:'https://planetbintang.github.io',RATE_LIMIT_MAX:'100'},stdio:'ignore'});
 const base='http://127.0.0.1:'+port,origin='https://planetbintang.github.io';t.after(async()=>{child.kill('SIGTERM');await rm(dir,{recursive:true,force:true})});
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.equal(ready,true);
 const suffix=randomUUID(),email='vd-'+suffix+'@example.invalid',password=String.fromCharCode(86,68,45,65,99,99,111,117,110,116,45,84,101,115,116,45,50,48,50,54,33);
 const post=(route,data,auth)=>fetch(base+route,{method:'POST',headers:{'content-type':'application/json',origin,...(auth?{authorization:'Bearer '+auth}:{})},body:JSON.stringify(data)});
 const reg=await post('/api/auth/register',{displayName:'Workspace Test',email,password});assert.equal(reg.status,201);const account=await reg.json();assert.ok(account.token);assert.equal(account.role,'owner');assert.equal('passwordHash' in account.user,false);
 const headers={authorization:'Bearer '+account.token,origin,'content-type':'application/json'};
 const me=await fetch(base+'/api/auth/me',{headers});assert.equal(me.status,200);
 const domain=await post('/api/account/domains',{domain:'account-test.example',purpose:'website'},account.token);assert.equal(domain.status,201);
 const file=await post('/api/account/files',{name:'domain-config.json',type:'domain-config',size:128},account.token);assert.equal(file.status,201);
 const overview=await (await fetch(base+'/api/account/overview',{headers})).json();assert.equal(overview.counts.domains,1);assert.equal(overview.counts.files,1);
 const second=await post('/api/auth/register',{displayName:'Other Workspace',email:'other-'+suffix+'@example.invalid',password});assert.equal(second.status,201);
 const other=await fetch(base+'/api/account/domains',{headers:{authorization:'Bearer '+(await second.json()).token}});assert.equal((await other.json()).domains.length,0);
 const profile=await fetch(base+'/api/account/profile',{method:'PUT',headers,body:JSON.stringify({displayName:'Updated Workspace',company:'PlanetBintang'})});assert.equal(profile.status,200);assert.equal((await profile.json()).user.profile.company,'PlanetBintang');
 const bad=await post('/api/auth/login',{email,password:'invalid'});assert.equal(bad.status,401);
 const login=await post('/api/auth/login',{email,password});assert.equal(login.status,200);const session=await login.json();
 const logout=await fetch(base+'/api/auth/logout',{method:'POST',headers:{authorization:'Bearer '+session.token,origin}});assert.equal(logout.status,200);
 const revoked=await fetch(base+'/api/auth/me',{headers:{authorization:'Bearer '+session.token}});assert.equal(revoked.status,401);
});
