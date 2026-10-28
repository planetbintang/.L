/* 019 — Taskbar; modul JS pasangan 019-taskbar.reic */
export const component={id:"INFRA-019",title:"Taskbar",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
