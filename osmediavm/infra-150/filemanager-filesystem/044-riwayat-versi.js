/* 044 — Riwayat versi; modul JS pasangan 044-riwayat-versi.reic */
export const component={id:"INFRA-044",title:"Riwayat versi",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
