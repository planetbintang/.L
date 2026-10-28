/* 124 — Pengujian sebelum rilis; modul JS pasangan 124-pengujian-sebelum-rilis.reic */
export const component={id:"INFRA-124",title:"Pengujian sebelum rilis",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
