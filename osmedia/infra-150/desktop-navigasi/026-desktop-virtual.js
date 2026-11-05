/* 026 — Desktop virtual; modul JS pasangan 026-desktop-virtual.reic */
export const component={id:"INFRA-026",title:"Desktop virtual",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
