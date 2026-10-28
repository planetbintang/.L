/* 099 — Mesin pencarian teks; modul JS pasangan 099-mesin-pencarian-teks.reic */
export const component={id:"INFRA-099",title:"Mesin pencarian teks",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
