/* 087 — Lingkungan pengembangan; modul JS pasangan 087-lingkungan-pengembangan.reic */
export const component={id:"INFRA-087",title:"Lingkungan pengembangan",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
