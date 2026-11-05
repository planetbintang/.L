/* 014 — Dukungan berbagai resolusi; modul JS pasangan 014-dukungan-berbagai-resolusi.reic */
export const component={id:"INFRA-014",title:"Dukungan berbagai resolusi",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
