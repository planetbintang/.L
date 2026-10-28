/* 076 — Runtime aplikasi; modul JS pasangan 076-runtime-aplikasi.reic */
export const component={id:"INFRA-076",title:"Runtime aplikasi",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
