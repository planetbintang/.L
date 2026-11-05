/* 017 — Bilah menu utama; modul JS pasangan 017-bilah-menu-utama.reic */
export const component={id:"INFRA-017",title:"Bilah menu utama",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
