/* 149 — Dokumentasi arsitektur; modul JS pasangan 149-dokumentasi-arsitektur.reic */
export const component={id:"INFRA-149",title:"Dokumentasi arsitektur",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
