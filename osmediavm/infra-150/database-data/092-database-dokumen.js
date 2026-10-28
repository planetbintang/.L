/* 092 — Database dokumen; modul JS pasangan 092-database-dokumen.reic */
export const component={id:"INFRA-092",title:"Database dokumen",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
