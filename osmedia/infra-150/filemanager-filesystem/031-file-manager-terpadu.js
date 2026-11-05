/* 031 — File manager terpadu; modul JS pasangan 031-file-manager-terpadu.reic */
export const component={id:"INFRA-031",title:"File manager terpadu",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
