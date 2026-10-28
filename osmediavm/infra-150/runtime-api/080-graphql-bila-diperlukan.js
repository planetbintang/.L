/* 080 — GraphQL bila diperlukan; modul JS pasangan 080-graphql-bila-diperlukan.reic */
export const component={id:"INFRA-080",title:"GraphQL bila diperlukan",category:"runtime-api",status:"blueprint",runtime:"browser",backendRequired:true};
export function mount(root){if(!root)return()=>{};root.dataset.reicId=component.id;root.setAttribute("aria-label",component.title);return()=>{delete root.dataset.reicId;root.removeAttribute("aria-label")}}
