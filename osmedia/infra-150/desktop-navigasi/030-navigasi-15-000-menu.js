/* 030 — Navigasi 15.000+ menu; modul JS pasangan 030-navigasi-15-000-menu.reic */
export const component={id:"INFRA-030",title:"Navigasi 15.000+ menu",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
