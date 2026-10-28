/* 094 — Replikasi database; modul JS pasangan 094-replikasi-database.reic */
export const component={id:"INFRA-094",title:"Replikasi database",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
