/* 118 — OCR; modul JS pasangan 118-ocr.reic */
export const component={id:"INFRA-118",title:"OCR",category:"ai-otomasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
