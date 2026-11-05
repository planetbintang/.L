/* 141 — Core Web Vitals; modul JS pasangan 141-core-web-vitals.reic */
export const component={id:"INFRA-141",title:"Core Web Vitals",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
