/* 015 — Panduan konsistensi visual; modul JS pasangan 015-panduan-konsistensi-visual.reic */
export const component={id:"INFRA-015",title:"Panduan konsistensi visual",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
