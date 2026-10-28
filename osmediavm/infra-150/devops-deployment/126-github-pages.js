/* 126 — GitHub Pages; modul JS pasangan 126-github-pages.reic */
export const component={id:"INFRA-126",title:"GitHub Pages",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
