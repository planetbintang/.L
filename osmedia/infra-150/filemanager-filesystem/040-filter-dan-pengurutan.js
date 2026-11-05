/* 040 — Filter dan pengurutan; modul JS pasangan 040-filter-dan-pengurutan.reic */
export const component={id:"INFRA-040",title:"Filter dan pengurutan",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
