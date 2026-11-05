/* 082 — Pemrosesan pekerjaan latar; modul JS pasangan 082-pemrosesan-pekerjaan-latar.reic */
export const component={id:"INFRA-082",title:"Pemrosesan pekerjaan latar",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
