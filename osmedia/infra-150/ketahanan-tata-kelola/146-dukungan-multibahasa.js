/* 146 — Dukungan multibahasa; modul JS pasangan 146-dukungan-multibahasa.reic */
export const component={id:"INFRA-146",title:"Dukungan multibahasa",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
