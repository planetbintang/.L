/* 101 — Pengelolaan metadata; modul JS pasangan 101-pengelolaan-metadata.reic */
export const component={id:"INFRA-101",title:"Pengelolaan metadata",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
