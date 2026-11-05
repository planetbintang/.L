/* 115 — Otomasi alur kerja; modul JS pasangan 115-otomasi-alur-kerja.reic */
export const component={id:"INFRA-115",title:"Otomasi alur kerja",category:"ai-otomasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
