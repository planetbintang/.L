/* 062 — Firewall aplikasi web; modul JS pasangan 062-firewall-aplikasi-web.reic */
export const component={id:"INFRA-062",title:"Firewall aplikasi web",category:"keamanan-privasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
