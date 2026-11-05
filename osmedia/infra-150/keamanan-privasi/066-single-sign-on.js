/* 066 — Single sign-on; modul JS pasangan 066-single-sign-on.reic */
export const component={id:"INFRA-066",title:"Single sign-on",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
