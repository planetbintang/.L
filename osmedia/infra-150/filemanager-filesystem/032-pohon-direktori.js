/* 032 — Pohon direktori; modul JS pasangan 032-pohon-direktori.reic */
export const component={id:"INFRA-032",title:"Pohon direktori",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
