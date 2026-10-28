/* 045 — Indeks berkas dan metadata; modul JS pasangan 045-indeks-berkas-dan-metadata.reic */
export const component={id:"INFRA-045",title:"Indeks berkas dan metadata",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
