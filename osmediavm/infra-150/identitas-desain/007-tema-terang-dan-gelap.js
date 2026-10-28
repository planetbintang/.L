/* 007 — Tema terang dan gelap; modul JS pasangan 007-tema-terang-dan-gelap.reic */
export const component={id:"INFRA-007",title:"Tema terang dan gelap",category:"identitas-desain",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
