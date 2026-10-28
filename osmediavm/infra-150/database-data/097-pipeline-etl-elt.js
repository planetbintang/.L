/* 097 — Pipeline ETL/ELT; modul JS pasangan 097-pipeline-etl-elt.reic */
export const component={id:"INFRA-097",title:"Pipeline ETL/ELT",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
