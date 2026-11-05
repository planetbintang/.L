/* 132 — Log terpusat; modul JS pasangan 132-log-terpusat.reic */
export const component={id:"INFRA-132",title:"Log terpusat",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
