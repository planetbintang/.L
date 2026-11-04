/* VMDESKTOPREIC COMPONENT REGISTRY — shared component contracts and discovery. */
(()=> {
 'use strict';
 const root=window.VMDESKTOPREIC||(window.VMDESKTOPREIC={});
 const registry=root.components||(root.components=new Map());
 const definitions=[
  {id:'desktop-shell',selector:'.vm-shell',group:'layout',description:'Kontainer desktop utama'},
  {id:'desktop-header',selector:'.vm-header',group:'navigation',description:'Bilah identitas dan alat desktop'},
  {id:'core-menu',selector:'.vm-core-menu',group:'navigation',description:'Navigasi modul inti'},
  {id:'slide-panel',selector:'.vm-slide-panel',group:'navigation',description:'Panel submenu kontekstual'},
  {id:'workspace',selector:'.vm-workspace',group:'workspace',description:'Area kerja utama'},
  {id:'center-search',selector:'.vm-center-search',group:'utility',description:'Pencarian aplikasi dan komponen'},
  {id:'modal',selector:'.vm-modal',group:'overlay',description:'Jendela kerja modal'},
  {id:'file-manager',selector:'[data-app="filemanager"],.filemanager-app',group:'application',description:'Aplikasi pengelola berkas'},
  {id:'statusbar',selector:'.vm-statusbar',group:'system',description:'Status runtime desktop'}
 ];
 for(const item of definitions){
  if(!registry.has(item.id))registry.set(item.id,Object.freeze({...item}));
 }
 root.registerComponent=(definition)=>{
  if(!definition||!definition.id||!definition.selector)throw new TypeError('Komponen wajib memiliki id dan selector.');
  const value=Object.freeze({...definition});
  registry.set(value.id,value);
  root.events?.emit('component:registered',value);
  return value;
 };
 root.getComponent=id=>registry.get(id)||null;
 root.listComponents=()=>Array.from(registry.values());
 root.discoverComponents=(scope=document)=>{
  const found=[];
  for(const item of registry.values()){
   const nodes=Array.from(scope.querySelectorAll(item.selector));
   nodes.forEach((node,index)=>{
    node.dataset.vmComponent=item.id;
    found.push({id:item.id,group:item.group,node,index});
   });
  }
  root.events?.emit('components:discovered',{count:found.length,components:found.map(x=>x.id)});
  return found;
 };
})();