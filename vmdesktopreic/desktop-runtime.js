/* VMDESKTOPREIC — mount the 31-screen REIC system inside the desktop container. */
(()=>{'use strict';
 const open=id=>{const button=document.querySelector('.core-item[data-core="'+String(id).replace(/[^a-z0-9_-]/gi,'')+'"]');if(button){button.click();return true;}return false;};
 const desktop=()=>document.querySelector('#vmDesktop.vm-shell')||document.querySelector('.vm-shell');
 window.VMDESKTOPREIC=Object.freeze({id:'PB-VM-CORE-001',mode:'single-logical-container',open,get status(){return {ready:!!desktop(),core:window.__PLANETBINTANG_VM_CORE__?.id||'PB-VM-CORE-001',applications:250,additionalViews:31,registryCapacity:1500000,indexedFiles:423408,fileRoot:'./reic1500000/'};}});
 (async()=>{try{
  const base='./reic31/index',host=desktop();if(!host)throw Error('Kontainer desktop #vmDesktop tidak ditemukan');
  const [markup,styles,functions]=await Promise.all(['.reic','.reicss','.reicjs'].map(ext=>fetch(base+ext,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(ext+' HTTP '+r.status);return r.text();})));
  if(!host.querySelector('#reic31-app'))host.insertAdjacentHTML('beforeend',markup);
  let style=document.querySelector('style[data-reic31]');if(!style){style=document.createElement('style');style.dataset.reic31='';document.head.append(style);}style.textContent=styles;
  const script=document.createElement('script');script.dataset.reic31Runtime='';script.textContent=functions;document.body.append(script);
  host.dataset.reic31='ready';document.documentElement.dataset.reic31='ready';
  const modalSystem=document.createElement('script');modalSystem.src='./desktop-reic-system.js?v=20261103-reic31-modal-v1';modalSystem.defer=true;document.body.append(modalSystem);
 }catch(error){console.error('REIC31 tidak dapat dimuat:',error);document.documentElement.dataset.reic31='error';}})();
 document.documentElement.dataset.vmdesktopRuntime='single-core-ready';
})();