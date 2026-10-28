/* 059 — Penyimpanan objek; modul JS pasangan 059-penyimpanan-objek.reic */
export const component={id:"INFRA-059",title:"Penyimpanan objek",category:"server-cloud",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
