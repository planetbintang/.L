/* 147 — Analitik penggunaan; modul JS pasangan 147-analitik-penggunaan.reic */
export const component={id:"INFRA-147",title:"Analitik penggunaan",category:"ketahanan-tata-kelola",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
