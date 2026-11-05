/* 136 — High availability; modul JS pasangan 136-high-availability.reic */
export const component={id:"INFRA-136",title:"High availability",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
