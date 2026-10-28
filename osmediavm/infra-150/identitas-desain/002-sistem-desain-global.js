/* 002 — Sistem desain global; modul JS pasangan 002-sistem-desain-global.reic */
export const component={id:"INFRA-002",title:"Sistem desain global",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
