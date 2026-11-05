/* 104 — Backup database; modul JS pasangan 104-backup-database.reic */
export const component={id:"INFRA-104",title:"Backup database",category:"database-data",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
