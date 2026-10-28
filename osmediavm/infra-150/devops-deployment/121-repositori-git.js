/* 121 — Repositori Git; modul JS pasangan 121-repositori-git.reic */
export const component={id:"INFRA-121",title:"Repositori Git",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
