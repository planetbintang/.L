/* 127 — Pengelolaan domain; modul JS pasangan 127-pengelolaan-domain.reic */
export const component={id:"INFRA-127",title:"Pengelolaan domain",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
