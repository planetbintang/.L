/* 079 — REST API; modul JS pasangan 079-rest-api.reic */
export const component={id:"INFRA-079",title:"REST API",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
