/* 089 — Pengujian otomatis; modul JS pasangan 089-pengujian-otomatis.reic */
export const component={id:"INFRA-089",title:"Pengujian otomatis",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
