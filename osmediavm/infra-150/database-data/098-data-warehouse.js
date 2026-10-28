/* 098 — Data warehouse; modul JS pasangan 098-data-warehouse.reic */
export const component={id:"INFRA-098",title:"Data warehouse",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
