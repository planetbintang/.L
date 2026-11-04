/* VMDESKTOPREIC COMPONENT BRIDGE — namespaced event and integration API. */
(()=> {
 'use strict';
 const root=window.VMDESKTOPREIC||(window.VMDESKTOPREIC={});
 const listeners=new Map();
 root.events={
  on(type,handler){
   if(typeof handler!=='function')throw new TypeError('Handler harus berupa fungsi.');
   if(!listeners.has(type))listeners.set(type,new Set());
   listeners.get(type).add(handler);
   return ()=>listeners.get(type)?.delete(handler);
  },
  once(type,handler){
   const off=this.on(type,payload=>{off();handler(payload);});
   return off;
  },
  emit(type,detail={}){
   for(const handler of listeners.get(type)||[]){
    try{handler(detail);}catch(error){console.error('[VMREIC event]',type,error);}
   }
   window.dispatchEvent(new CustomEvent('vmreic:'+type,{detail}));
  },
  clear(type){if(type)listeners.delete(type);else listeners.clear();}
 };
 root.bridge={
  version:'1.0.0',
  emit:(name,detail)=>root.events.emit('app:'+name,detail),
  request(name,detail={}){
   const event=new CustomEvent('vmreic:request:'+name,{detail,cancelable:true});
   window.dispatchEvent(event);
   return !event.defaultPrevented;
  },
  connect(name,handler){return root.events.on('app:'+name,handler);},
  status(){return {environment:!!root.environment,registry:!!root.components,componentCount:root.listComponents?.().length||0,ready:root.ready===true};}
 };
 document.addEventListener('click',event=>{
  const target=event.target.closest('[data-vm-action]');
  if(!target)return;
  root.events.emit('action:invoke',{action:target.dataset.vmAction,component:target.dataset.vmComponent||null,element:target});
 });
})();