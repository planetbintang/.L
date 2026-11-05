/* 130 — Deployment preview; modul JS pasangan 130-deployment-preview.reic */
export const component={id:"INFRA-130",title:"Deployment preview",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
