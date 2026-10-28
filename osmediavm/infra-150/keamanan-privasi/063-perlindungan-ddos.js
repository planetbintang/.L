/* 063 — Perlindungan DDoS; modul JS pasangan 063-perlindungan-ddos.reic */
export const component={id:"INFRA-063",title:"Perlindungan DDoS",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
