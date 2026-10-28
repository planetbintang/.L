/* 061 — HTTPS dan TLS; modul JS pasangan 061-https-dan-tls.reic */
export const component={id:"INFRA-061",title:"HTTPS dan TLS",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
