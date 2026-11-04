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