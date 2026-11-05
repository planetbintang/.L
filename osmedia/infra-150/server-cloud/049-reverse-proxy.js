/* 049 — Reverse proxy; modul JS pasangan 049-reverse-proxy.reic */
export const component={id:"INFRA-049",title:"Reverse proxy",category:"server-cloud",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
