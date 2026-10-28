/* 129 — Sertifikat TLS otomatis; modul JS pasangan 129-sertifikat-tls-otomatis.reic */
export const component={id:"INFRA-129",title:"Sertifikat TLS otomatis",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
