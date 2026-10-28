/* 072 — Proteksi dependensi; modul JS pasangan 072-proteksi-dependensi.reic */
export const component={id:"INFRA-072",title:"Proteksi dependensi",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
