/* 050 — Load balancer; modul JS pasangan 050-load-balancer.reic */
export const component={id:"INFRA-050",title:"Load balancer",category:"server-cloud",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
