import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const registry=JSON.parse(await readFile(path.join(root,'registry.json'),'utf8'));
const errors=[];let count=0;
for(const mod of registry.modules){
 const index=JSON.parse(await readFile(path.join(root,mod.path),'utf8'));
 if(index.component_count!==6||index.components.length!==6)errors.push(mod.key+': expected six components');
 for(const item of index.components){
  count++;const file=path.join(root,mod.key,item.path);
  try{const doc=JSON.parse(await readFile(file,'utf8'));
   if(doc.format!=='PLANETBINTANG-REIC'||doc.owner!=='OWNER'||doc.platform!=='PLANETBINTANG'||doc.policy_authority!=='SNAPS')errors.push(item.id+': invalid identity metadata');
   if(doc.access?.default_decision!=='DENY'||!doc.access?.tenant_scope_required||!doc.approval?.required)errors.push(item.id+': missing security gates');
   if(!doc.extensions?.includes('.reic')||!doc.extensions?.includes('.sql')||!doc.extensions?.includes('.js'))errors.push(item.id+': missing extension contract');
  }catch(e){errors.push(item.id+': '+e.message)}
 }
}
if(count!==36||registry.total_components!==36)errors.push('registry component count mismatch');
if(errors.length){console.error(errors.join('\\n'));process.exit(1)}
console.log('REIC platform validation passed: '+count+' components across '+registry.modules.length+' modules.');
