/* 025 — Sistem multiwindow; modul JS pasangan 025-sistem-multiwindow.reic */
export const component={id:"INFRA-025",title:"Sistem multiwindow",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
