/* 134 — Distributed tracing; modul JS pasangan 134-distributed-tracing.reic */
export const component={id:"INFRA-134",title:"Distributed tracing",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
