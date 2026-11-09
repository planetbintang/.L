/* PlanetBintang REIC Language Runtime
 * Loads custom .REICSS and .REICJS resources through fetch so GitHub Pages
 * does not need to recognize custom MIME types. .REIC documents are parsed
 * as JSON manifests or trusted HTML-compatible templates by the public API.
 */
(()=>{'use strict';
const VERSION='1.0.0';
const loadedStyles=new Set(),loadedScripts=new Set();
const toURL=value=>new URL(value,document.baseURI).href;
async function source(url){
 const absolute=toURL(url);
 const response=await fetch(absolute,{cache:'no-cache'});
 if(!response.ok)throw new Error('REIC: gagal memuat '+absolute+' (HTTP '+response.status+')');
 return {url:absolute,text:await response.text()};
}
async function loadStyle(url){
 const absolute=toURL(url);if(loadedStyles.has(absolute))return;
 const item=await source(absolute),style=document.createElement('style');
 style.dataset.reicSource=absolute;style.textContent=item.text;
 document.head.append(style);loadedStyles.add(absolute);
}
function resolveModuleSpecifiers(code,base){
 return code
 .replace(/(\bfrom\s*|\bimport\s*\()(['"])(\.\.?\/[^'"]+)\2/g,(all,prefix,q,spec)=>prefix+q+new URL(spec,base).href+q);
}
async function loadScript(url){
 const absolute=toURL(url);if(loadedScripts.has(absolute))return;
 const item=await source(absolute);
 const code=resolveModuleSpecifiers(item.text,item.url);
 const blobURL=URL.createObjectURL(new Blob([code+'\n//# sourceURL='+item.url],{type:'text/javascript'}));
 try{await import(blobURL);loadedScripts.add(absolute);}
 finally{URL.revokeObjectURL(blobURL);}
}
async function readDocument(url){
 const item=await source(url);
 try{return {kind:'manifest',url:item.url,value:JSON.parse(item.text)};}
 catch{return {kind:'template',url:item.url,value:item.text};}
}
function mountDocument(documentSource,target,options={}){
 if(!documentSource||!target)throw new TypeError('Dokumen REIC dan target wajib tersedia.');
 const template=document.createElement('template');
 template.innerHTML=String(documentSource.value??'');
 if(options.trusted!==true){
  template.content.querySelectorAll('script,iframe,object,embed').forEach(node=>node.remove());
  template.content.querySelectorAll('*').forEach(node=>{
   [...node.attributes].forEach(attr=>{
    if(/^on/i.test(attr.name)||(/^(href|src|action|formaction)$/i.test(attr.name)&&/^\s*javascript:/i.test(attr.value)))node.removeAttribute(attr.name);
   });
  });
 }
 target.replaceChildren(template.content.cloneNode(true));
 return target;
}
const api={
 version:VERSION,
 extensions:{document:'.reic',style:'.reicss',script:'.reicjs'},
 capabilities:{
  document:'HTML-compatible templates and JSON manifests',
  style:'CSS standard with custom properties, media queries and animations',
  script:'Native ECMAScript modules, import/export and browser APIs',
  typescript:'Compile .ts/.tsx and typed JSX at build time before browser delivery',
  php:'Server-side PHP requires a PHP-capable backend; static GitHub Pages uses HTTP API endpoints'
 },
 loadStyle,loadScript,readDocument,mountDocument,
 async boot(config){
  for(const file of config.styles||[])await loadStyle(file);
  for(const file of config.scripts||[])await loadScript(file);
  document.documentElement.dataset.reicRuntime=VERSION;
  return api;
 }
};
window.REIC=Object.assign(window.REIC||{},api);
window.REIC.ready=api.boot({
 styles:['./system.reicss','./runtime.reicss','./infrastruktur.reicss'],
 scripts:['./runtime.reicjs','./infrastruktur.reicjs']
}).catch(error=>{
 console.error(error);
 const notice=document.createElement('div');
 notice.setAttribute('role','alert');
 notice.textContent='REIC Runtime gagal dimuat: '+error.message;
 notice.style.cssText='position:fixed;z-index:100000;bottom:12px;left:12px;right:12px;padding:12px;background:#541b2b;color:white;border:1px solid #ff9bb3;font:13px system-ui';
 document.body.append(notice);
 throw error;
});
})();