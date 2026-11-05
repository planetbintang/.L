/* 024 — Pengelola jendela; modul JS pasangan 024-pengelola-jendela.reic */
export const component={id:"INFRA-024",title:"Pengelola jendela",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
