/* 022 — Pusat notifikasi; modul JS pasangan 022-pusat-notifikasi.reic */
export const component={id:"INFRA-022",title:"Pusat notifikasi",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
