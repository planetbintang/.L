/* 033 — Sistem folder bertingkat; modul JS pasangan 033-sistem-folder-bertingkat.reic */
export const component={id:"INFRA-033",title:"Sistem folder bertingkat",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
