/* 150 — Dashboard tata kelola; modul JS pasangan 150-dashboard-tata-kelola.reic */
export const component={id:"INFRA-150",title:"Dashboard tata kelola",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
