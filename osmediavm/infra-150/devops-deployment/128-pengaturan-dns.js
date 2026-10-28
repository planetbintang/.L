/* 128 — Pengaturan DNS; modul JS pasangan 128-pengaturan-dns.reic */
export const component={id:"INFRA-128",title:"Pengaturan DNS",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
