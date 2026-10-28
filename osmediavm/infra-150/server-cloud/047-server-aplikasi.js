/* 047 — Server aplikasi; modul JS pasangan 047-server-aplikasi.reic */
export const component={id:"INFRA-047",title:"Server aplikasi",category:"server-cloud",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
