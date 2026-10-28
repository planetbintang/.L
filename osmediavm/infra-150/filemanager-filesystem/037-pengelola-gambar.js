/* 037 — Pengelola gambar; modul JS pasangan 037-pengelola-gambar.reic */
export const component={id:"INFRA-037",title:"Pengelola gambar",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
