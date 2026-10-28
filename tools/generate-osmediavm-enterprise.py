#!/usr/bin/env python3
"""Generate paired CSS and JavaScript adapters for every OS MEDIA VM REIC record."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECORDIN = ROOT / "osmediavm" / "recordin"
MANIFEST = RECORDIN / "manifest.json"

def title_from(path):
    return re.sub(r"[-_]+", " ", path.stem).strip().title()

def css_for(stem):
    return """/* Generated component stylesheet; safe to customize. */
.reic-component[data-component=""" + json.dumps(stem) + """]{display:block;min-width:0;color:var(--reic-text,#eaf3ff);background:var(--reic-surface,#0d1b2d);border:1px solid var(--reic-border,#29415d);padding:1rem}
.reic-component[data-component=""" + json.dumps(stem) + """] :focus-visible{outline:2px solid var(--reic-accent,#78dcff);outline-offset:3px}
.reic-component[data-component=""" + json.dumps(stem) + """] .reic-component-title{font:600 1rem/1.4 system-ui,sans-serif;overflow-wrap:anywhere}
.reic-component[data-component=""" + json.dumps(stem) + """] .reic-component-state{color:var(--reic-muted,#b6c8dc);font-size:.875rem;line-height:1.6}
@media(max-width:700px){.reic-component[data-component=""" + json.dumps(stem) + """]{padding:.75rem}}
@media(prefers-reduced-motion:reduce){.reic-component[data-component=""" + json.dumps(stem) + """] *{animation:none!important;transition:none!important}}
"""

def js_for(stem, title):
    return """/* Generated safe adapter. REIC text is never evaluated as JavaScript. */
(function(){
'use strict';
const COMPONENT=""" + json.dumps(stem) + """;
const TITLE=""" + json.dumps(title, ensure_ascii=False) + """;
function mount(root,options={}){
 if(!root||root.dataset.reicMounted==='true')return root;
 root.dataset.reicMounted='true';root.classList.add('reic-component');root.dataset.component=COMPONENT;
 if(!root.querySelector('[data-reic-title]')){
  const h=document.createElement('h3');h.className='reic-component-title';h.dataset.reicTitle='true';h.textContent=options.title||TITLE;root.prepend(h);
 }
 root.dispatchEvent(new CustomEvent('reic:mounted',{bubbles:true,detail:{component:COMPONENT,title:TITLE}}));return root;
}
function requestJson(url,options={}){
 if(typeof url!=='string'||!url.trim())return Promise.reject(new Error('API URL belum dikonfigurasi.'));
 const method=String(options.method||'GET').toUpperCase();
 if(!['GET','POST','PUT','PATCH','DELETE'].includes(method))return Promise.reject(new Error('Metode API tidak diizinkan.'));
 return fetch(url,{...options,method,headers:{Accept:'application/json',...(options.headers||{})}})
 .then(async response=>{const body=await response.text();let data;try{data=body?JSON.parse(body):null}catch{data=body}if(!response.ok)throw new Error('API HTTP '+response.status);return data});
}
window.OSMediaVMComponents=window.OSMediaVMComponents||{};
window.OSMediaVMComponents[COMPONENT]={mount,requestJson,title:TITLE};
document.querySelectorAll('[data-reic-component="'+COMPONENT+'"]').forEach(node=>mount(node));
})();
"""

def main():
    RECORDIN.mkdir(parents=True, exist_ok=True)
    reic_files = sorted(p for p in RECORDIN.glob("*.reic") if p.is_file())
    infra = [p for p in reic_files if p.name.startswith("infra-15000-")]
    if len(infra) < 15000:
        raise SystemExit(f"Perlu minimal 15.000 infra-15000-*.reic; ditemukan {len(infra)}.")
    manifest = []
    for path in reic_files:
        stem = path.stem
        css_path, js_path = path.with_suffix(".css"), path.with_suffix(".js")
        title = title_from(path)
        css_path.write_text(css_for(stem), encoding="utf-8")
        js_path.write_text(js_for(stem, title), encoding="utf-8")
        manifest.append({"file":path.name,"css":css_path.name,"js":js_path.name,"title":title,"source":"infrastruktur-15000" if stem.startswith("infra-15000-") else "recordin","id":stem})
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Verified input: {len(infra)} infrastructure REIC; generated {len(reic_files)} CSS + {len(reic_files)} JS files.")

if __name__ == "__main__":
    main()
