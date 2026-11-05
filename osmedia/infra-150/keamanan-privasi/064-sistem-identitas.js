/* 064 — Sistem identitas; modul JS pasangan 064-sistem-identitas.reic */
export const component={id:"INFRA-064",title:"Sistem identitas",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
