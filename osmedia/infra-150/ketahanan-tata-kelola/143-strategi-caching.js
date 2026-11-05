/* 143 — Strategi caching; modul JS pasangan 143-strategi-caching.reic */
export const component={id:"INFRA-143",title:"Strategi caching",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
