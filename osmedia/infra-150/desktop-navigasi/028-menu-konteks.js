/* 028 — Menu konteks; modul JS pasangan 028-menu-konteks.reic */
export const component={id:"INFRA-028",title:"Menu konteks",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
