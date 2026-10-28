/* 083 — Scheduler tugas; modul JS pasangan 083-scheduler-tugas.reic */
export const component={id:"INFRA-083",title:"Scheduler tugas",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
