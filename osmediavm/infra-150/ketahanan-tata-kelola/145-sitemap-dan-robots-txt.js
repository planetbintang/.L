/* 145 — Sitemap dan robots.txt; modul JS pasangan 145-sitemap-dan-robots-txt.reic */
export const component={id:"INFRA-145",title:"Sitemap dan robots.txt",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
