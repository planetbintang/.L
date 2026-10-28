/* 008 — Efek kaca dan transparansi; modul JS pasangan 008-efek-kaca-dan-transparansi.reic */
export const component={id:"INFRA-008",title:"Efek kaca dan transparansi",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
