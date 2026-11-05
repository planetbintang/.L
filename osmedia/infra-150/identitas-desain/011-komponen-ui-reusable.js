/* 011 — Komponen UI reusable; modul JS pasangan 011-komponen-ui-reusable.reic */
export const component={id:"INFRA-011",title:"Komponen UI reusable",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
