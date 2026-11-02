#!/usr/bin/env node
/**
 * VMDESKTOPREIC physical-file generator.
 * Total target: 500,000 REIC modules x (.reic + .reicss + .reicjs) = 1,500,000 files.
 * Generate bounded batches only; never generate/commit the full target in one operation.
 *
 * Usage:
 *   node generate.mjs --start 1 --count 100 --write
 *   node generate.mjs --start 101 --count 100 --write
 */
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>{
  if(v.startsWith("--")) a.push([v.slice(2), all[i+1] && !all[i+1].startsWith("--") ? all[i+1] : true]);
  return a;
},[]));
const start = Math.max(1, Number(args.start || 1));
const count = Math.max(1, Math.min(33333, Number(args.count || 100)));
const write = args.write === true;
const root = path.resolve(args.out || "generated");
const pad = n => String(n).padStart(7,"0");
const records = [];
for(let n=start;n<start+count;n++){
  const id=pad(n), dir=path.join(root,"modules",id);
  const title="REIC MODULE "+id;
  const files=[
    {name:"index.reic",body:`<!-- ${title} -->\n<reic-module id="reic-${id}" version="1.0.0"><header><h1>${title}</h1></header><main data-reic-module="${id}"><section class="reic-panel"><h2>MODUL ${id}</h2><p>STRUKTUR REIC TERGENERASI DAN SIAP DIKONFIGURASI.</p></section></main></reic-module>\n`},
    {name:"index.reicss",body:`/* ${title} */\n[data-reic-module="${id}"]{display:grid;gap:1rem;min-width:0;color:var(--reic-text,#eaf4ff)}\n[data-reic-module="${id}"] .reic-panel{padding:1.25rem;border:1px solid var(--reic-line,rgba(100,190,255,.25));border-radius:1rem;background:linear-gradient(145deg,#14263d,#081321)}\n`},
    {name:"index.reicjs",body:`/* ${title} */\nexport const reicModule=Object.freeze({id:"${id}",name:"${title}",version:"1.0.0"});\nexport function mount(root){if(!root)return false;root.dataset.reicModule=reicModule.id;root.dispatchEvent(new CustomEvent("reic:module-ready",{bubbles:true,detail:reicModule}));return true;}\n`}
  ];
  records.push({id,files:files.map(f=>path.posix.join("modules",id,f.name))});
  if(write){fs.mkdirSync(dir,{recursive:true});for(const f of files)fs.writeFileSync(path.join(dir,f.name),f.body,{flag:"wx"});}
}
const summary={system:"VMDESKTOPREIC",targetPhysicalFiles:1500000,targetModules:500000,filesPerModule:3,batch:{start,count,physicalFiles:count*3},written:write,records};
if(write){fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,"batch-manifest.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});}
console.log(JSON.stringify(summary,null,2));
