/* 096 — Validasi data; modul JS pasangan 096-validasi-data.reic */
export const component={id:"INFRA-096",title:"Validasi data",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
