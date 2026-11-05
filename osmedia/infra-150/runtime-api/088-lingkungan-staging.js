/* 088 — Lingkungan staging; modul JS pasangan 088-lingkungan-staging.reic */
export const component={id:"INFRA-088",title:"Lingkungan staging",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
