/* 039 — Pencarian berkas; modul JS pasangan 039-pencarian-berkas.reic */
export const component={id:"INFRA-039",title:"Pencarian berkas",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
