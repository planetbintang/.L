/* 005 — Ikonografi terpadu; modul JS pasangan 005-ikonografi-terpadu.reic */
export const component={id:"INFRA-005",title:"Ikonografi terpadu",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
