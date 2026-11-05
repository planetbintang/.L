/* 067 — Kontrol akses berbasis peran; modul JS pasangan 067-kontrol-akses-berbasis-peran.reic */
export const component={id:"INFRA-067",title:"Kontrol akses berbasis peran",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
