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
  {id:'statusbar',selector:'.vm-statusbar',group:'system',description:'Status runtime desktop'},
  {id:'filemanager-window',selector:'.pb-filemanajer-window',group:'files',description:'Jendela File Manager pusat'},
  {id:'filemanager-explorer',selector:'#reic-filemanager-app',group:'files',description:'Penjelajah folder dan file REIC'},
  {id:'filemanager-categories',selector:'[data-reic-category]',group:'registry',description:'Kategori sistem yang terintegrasi'},
  {id:'list-blok-library',selector:'[data-reic-category="list-blok"]',group:'components',description:'List Blok dan komponen UI'},
  {id:'layout-library',selector:'[data-reic-category="layout-library"]',group:'layout',description:'Layout Library desktop'},
  {id:'reic-explorer',selector:'[data-reic-category="reic-explorer"]',group:'files',description:'REIC Explorer'},
  {id:'infrastructure-config',selector:'[data-reic-category="infrastructure-config"]',group:'infrastructure',description:'Konfigurasi Infrastruktur'},
  {id:'infrastructure-15000',selector:'[data-reic-category="infrastructure-15000"]',group:'infrastructure',description:'Infrastruktur 15.000'},
  {id:'registry-1500',selector:'[data-reic-category="registry-1500"]',group:'registry',description:'Registri 1.500'},
  {id:'premium-150',selector:'[data-reic-category="premium-150"]',group:'applications',description:'150 Fitur Premium'},
  {id:'desktop-system-themes',selector:'[data-reic-category="system-themes"]',group:'themes',description:'Tema sistem desktop'}
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