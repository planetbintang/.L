/* 012 — Sistem desain responsif; modul JS pasangan 012-sistem-desain-responsif.reic */
export const component={id:"INFRA-012",title:"Sistem desain responsif",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
