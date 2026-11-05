/* 009 — Animasi antarmuka halus; modul JS pasangan 009-animasi-antarmuka-halus.reic */
export const component={id:"INFRA-009",title:"Animasi antarmuka halus",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
