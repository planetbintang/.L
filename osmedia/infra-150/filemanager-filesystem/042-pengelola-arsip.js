/* 042 — Pengelola arsip; modul JS pasangan 042-pengelola-arsip.reic */
export const component={id:"INFRA-042",title:"Pengelola arsip",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
