/* 100 — Indeks semantik; modul JS pasangan 100-indeks-semantik.reic */
export const component={id:"INFRA-100",title:"Indeks semantik",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
