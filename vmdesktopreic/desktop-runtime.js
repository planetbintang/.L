/* VMDESKTOPREIC — single-core runtime bridge. All navigation and application windows are owned by workspace.js. */
(()=>{'use strict';
 const open=id=>{
  const button=document.querySelector('.core-item[data-core="'+String(id).replace(/[^a-z0-9_-]/gi,'')+'"]');
  if(button){button.click();return true;}
  return false;
 };
 window.VMDESKTOPREIC=Object.freeze({
  id:'PB-VM-CORE-001',
  mode:'single-logical-container',
  open,
  get status(){return {ready:!!document.querySelector('.vm-shell'),core:window.__PLANETBINTANG_VM_CORE__?.id||'PB-VM-CORE-001',applications:250};}
 });
 document.documentElement.dataset.vmdesktopRuntime='single-core-ready';
})();