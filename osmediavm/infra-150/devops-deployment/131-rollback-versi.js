/* 131 — Rollback versi; modul JS pasangan 131-rollback-versi.reic */
export const component={id:"INFRA-131",title:"Rollback versi",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
