/* 016 — Desktop utama interaktif; modul JS pasangan 016-desktop-utama-interaktif.reic */
export const component={id:"INFRA-016",title:"Desktop utama interaktif",category:"desktop-navigasi",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
