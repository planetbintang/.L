/* 093 — Cache aplikasi; modul JS pasangan 093-cache-aplikasi.reic */
export const component={id:"INFRA-093",title:"Cache aplikasi",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
