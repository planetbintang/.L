/* VMDESKTOPREIC INTEGRATION BOOT — loads shared environment and component services. */
(()=> {
 'use strict';
 const root=window.VMDESKTOPREIC||(window.VMDESKTOPREIC={});
 if(root.integrationBooted)return;
 root.integrationBooted=true;
 const base='./';
 const load=src=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=src;
  script.async=false;
  script.onload=resolve;
  script.onerror=()=>reject(new Error('Modul integrasi gagal dimuat: '+src));
  document.head.appendChild(script);
 });
 (async()=>{
  try{
   await load(base+'environment/environment.js');
   const environmentStyle=document.createElement('link');
   environmentStyle.rel='stylesheet';
   environmentStyle.href=base+'environment/menu-catalog.css?v=20261106-reic-25000';
   document.head.appendChild(environmentStyle);
   const codeContainerStyle=document.createElement('link');
   codeContainerStyle.rel='stylesheet';
   codeContainerStyle.href=base+'environment/code-container.css?v=20261106-reic-code-container-1';
   document.head.appendChild(codeContainerStyle);
   const registryStyle=document.createElement('link');
   registryStyle.rel='stylesheet';
   registryStyle.href=base+'environment/registry.css?v=20261106-reic-registry-1';
   document.head.appendChild(registryStyle);
   await load(base+'environment/menu-catalog.js?v=20261106-reic-25000');
   await load(base+'environment/code-container.js?v=20261106-reic-code-container-1');
   await load(base+'environment/registry-worker.js?v=20261106-reic-registry-worker-1');
   await load(base+'environment/registry.js?v=20261106-reic-registry-1');
   await load(base+'integration/component-registry.js');
   await load(base+'integration/component-bridge.js');
   const discover=()=>root.discoverComponents(document);
   discover();
   const observer=new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length))discover();
   });
   observer.observe(document.getElementById('vmDesktop')||document.body,{childList:true,subtree:true});
   root.integrationObserver=observer;
   root.ready=true;
   root.events.emit('system:ready',{version:'1.0.0',components:root.listComponents().length});
   document.documentElement.classList.add('vmreic-integrated');
   console.info('[VMDESKTOPREIC] environment, registry, and bridge integrated.');
  }catch(error){
   root.ready=false;
   console.error('[VMDESKTOPREIC integration]',error);
   window.dispatchEvent(new CustomEvent('vmreic:integration-error',{detail:{message:error.message}}));
  }
 })();
})();
