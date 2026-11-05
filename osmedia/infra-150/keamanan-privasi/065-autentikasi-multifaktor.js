/* 065 — Autentikasi multifaktor; modul JS pasangan 065-autentikasi-multifaktor.reic */
export const component={id:"INFRA-065",title:"Autentikasi multifaktor",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
