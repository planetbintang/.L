/* 001 — Identitas merek dan logo utama; modul JS pasangan 001-identitas-merek-dan-logo-utama.reic */
export const component={id:"INFRA-001",title:"Identitas merek dan logo utama",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
