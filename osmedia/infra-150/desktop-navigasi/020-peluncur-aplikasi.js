/* 020 — Peluncur aplikasi; modul JS pasangan 020-peluncur-aplikasi.reic */
export const component={id:"INFRA-020",title:"Peluncur aplikasi",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
