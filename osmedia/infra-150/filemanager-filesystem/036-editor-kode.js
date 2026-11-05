/* 036 — Editor kode; modul JS pasangan 036-editor-kode.reic */
export const component={id:"INFRA-036",title:"Editor kode",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
