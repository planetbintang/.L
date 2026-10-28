/* 095 — Migrasi skema; modul JS pasangan 095-migrasi-skema.reic */
export const component={id:"INFRA-095",title:"Migrasi skema",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
