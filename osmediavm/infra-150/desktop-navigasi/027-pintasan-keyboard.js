/* 027 — Pintasan keyboard; modul JS pasangan 027-pintasan-keyboard.reic */
export const component={id:"INFRA-027",title:"Pintasan keyboard",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
