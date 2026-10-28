/* 004 — Tipografi profesional; modul JS pasangan 004-tipografi-profesional.reic */
export const component={id:"INFRA-004",title:"Tipografi profesional",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
