/* 003 — Palet warna premium; modul JS pasangan 003-palet-warna-premium.reic */
export const component={id:"INFRA-003",title:"Palet warna premium",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
