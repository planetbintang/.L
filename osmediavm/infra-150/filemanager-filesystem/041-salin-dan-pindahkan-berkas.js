/* 041 — Salin dan pindahkan berkas; modul JS pasangan 041-salin-dan-pindahkan-berkas.reic */
export const component={id:"INFRA-041",title:"Salin dan pindahkan berkas",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
