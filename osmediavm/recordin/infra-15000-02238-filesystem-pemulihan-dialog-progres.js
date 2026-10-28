/* Generated safe adapter. REIC text is never evaluated as JavaScript. */
(function(){
'use strict';
const COMPONENT="infra-15000-02238-filesystem-pemulihan-dialog-progres";
const TITLE="Infra 15000 02238 Filesystem Pemulihan Dialog Progres";
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
