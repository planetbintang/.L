/* 038 — Pengelola audio dan video; modul JS pasangan 038-pengelola-audio-dan-video.reic */
export const component={id:"INFRA-038",title:"Pengelola audio dan video",category:"filemanager-filesystem",status:"blueprint",runtime:"browser",backendRequired:false};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
