/* 029 — Modal dialog standar; modul JS pasangan 029-modal-dialog-standar.reic */
export const component={id:"INFRA-029",title:"Modal dialog standar",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
