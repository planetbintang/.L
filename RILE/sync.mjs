import fs from 'node:fs/promises';
const owner='planetbintang', token=process.env.PLANETBINTANG_GITHUB_TOKEN||process.env.GITHUB_TOKEN;
if(!token) throw new Error('PLANETBINTANG_GITHUB_TOKEN belum dikonfigurasi.');
const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
async function get(url){const r=await fetch(url,{headers});if(!r.ok)throw new Error('GitHub API '+r.status+' '+url);return r.json()}
async function pages(url,key){let all=[],page=1;for(;;){const data=await get(url+(url.includes('?')?'&':'?')+'per_page=100&page='+page);const rows=Array.isArray(data)?data:data[key]||[];all.push(...rows);if(rows.length<100)break;page++;}return all}
async function pool(items,limit,fn){const out=new Array(items.length);let next=0;await Promise.all(Array.from({length:limit},async()=>{for(;;){const i=next++;if(i>=items.length)return;try{out[i]=await fn(items[i])}catch(e){out[i]={error:e.message}}}}));return out}
const repos=await pages('https://api.github.com/users/'+owner+'/repos?type=all&sort=updated','');
const records=await pool(repos,8,async repo=>{
 const [workflows,runs]=await Promise.all([
  pages(repo.url+'/actions/workflows','workflows'),
  pages(repo.url+'/actions/runs','workflow_runs').then(x=>x.slice(0,100))
 ]);
 const latest=new Map();for(const run of runs){if(!latest.has(run.workflow_id))latest.set(run.workflow_id,run)}
 return {name:repo.name,full_name:repo.full_name,private:repo.private,html_url:repo.html_url,default_branch:repo.default_branch,workflows:workflows.map(w=>{const r=latest.get(w.id);return {id:w.id,name:w.name,path:w.path,state:w.state,html_url:w.html_url,status:r?.status||'unknown',conclusion:r?.conclusion||null,branch:r?.head_branch||null,event:r?.event||null,created_at:r?.created_at||null,updated_at:r?.updated_at||null,run_url:r?.html_url||null}})};
});
const clean=records.filter(x=>x&&!x.error);
const payload={schema:1,generated_at:new Date().toISOString(),owner,repository_count:repos.length,repository_errors:records.filter(x=>x?.error).length,workflow_count:clean.reduce((n,r)=>n+r.workflows.length,0),repositories:clean};
await fs.mkdir('RILE/data',{recursive:true});await fs.writeFile('RILE/data/index.json',JSON.stringify(payload));
console.log('Synced',payload.repository_count,'repositories and',payload.workflow_count,'workflows.');
