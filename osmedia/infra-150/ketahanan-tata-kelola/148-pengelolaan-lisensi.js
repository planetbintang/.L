/* 148 — Pengelolaan lisensi; modul JS pasangan 148-pengelolaan-lisensi.reic */
export const component={id:"INFRA-148",title:"Pengelolaan lisensi",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
