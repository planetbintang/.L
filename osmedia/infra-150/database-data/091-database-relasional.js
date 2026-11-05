/* 091 — Database relasional; modul JS pasangan 091-database-relasional.reic */
export const component={id:"INFRA-091",title:"Database relasional",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
