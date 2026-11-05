/* 043 — Recycle bin; modul JS pasangan 043-recycle-bin.reic */
export const component={id:"INFRA-043",title:"Recycle bin",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
