/* 071 — Pemindaian kerentanan; modul JS pasangan 071-pemindaian-kerentanan.reic */
export const component={id:"INFRA-071",title:"Pemindaian kerentanan",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
