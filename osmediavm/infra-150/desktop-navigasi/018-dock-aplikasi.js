/* 018 — Dock aplikasi; modul JS pasangan 018-dock-aplikasi.reic */
export const component={id:"INFRA-018",title:"Dock aplikasi",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
