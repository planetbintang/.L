/* 084 — Webhook; modul JS pasangan 084-webhook.reic */
export const component={id:"INFRA-084",title:"Webhook",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
