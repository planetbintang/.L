/* 035 — Editor teks; modul JS pasangan 035-editor-teks.reic */
export const component={id:"INFRA-035",title:"Editor teks",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
