/* 006 — Tata letak adaptif; modul JS pasangan 006-tata-letak-adaptif.reic */
export const component={id:"INFRA-006",title:"Tata letak adaptif",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
