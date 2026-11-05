/* 125 — Deployment otomatis; modul JS pasangan 125-deployment-otomatis.reic */
export const component={id:"INFRA-125",title:"Deployment otomatis",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
