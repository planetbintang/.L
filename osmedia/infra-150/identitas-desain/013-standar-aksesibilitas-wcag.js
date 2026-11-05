/* 013 — Standar aksesibilitas WCAG; modul JS pasangan 013-standar-aksesibilitas-wcag.reic */
export const component={id:"INFRA-013",title:"Standar aksesibilitas WCAG",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
