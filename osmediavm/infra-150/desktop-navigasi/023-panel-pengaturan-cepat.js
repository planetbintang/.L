/* 023 — Panel pengaturan cepat; modul JS pasangan 023-panel-pengaturan-cepat.reic */
export const component={id:"INFRA-023",title:"Panel pengaturan cepat",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
