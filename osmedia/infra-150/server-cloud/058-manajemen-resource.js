/* 058 — Manajemen resource; modul JS pasangan 058-manajemen-resource.reic */
export const component={id:"INFRA-058",title:"Manajemen resource",category:"server-cloud",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
