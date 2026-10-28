/* 123 — Build otomatis; modul JS pasangan 123-build-otomatis.reic */
export const component={id:"INFRA-123",title:"Build otomatis",category:"devops-deployment",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
