/* 110 — RAG dan basis pengetahuan; modul JS pasangan 110-rag-dan-basis-pengetahuan.reic */
export const component={id:"INFRA-110",title:"RAG dan basis pengetahuan",category:"ai-otomasi",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
