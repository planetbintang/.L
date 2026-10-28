/* 060 — Pemantauan kapasitas; modul JS pasangan 060-pemantauan-kapasitas.reic */
export const component={id:"INFRA-060",title:"Pemantauan kapasitas",category:"server-cloud",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
