/* VMDESKTOPREIC · universal desktop click-to-window bridge
 * Routes desktop launch controls to independent, visible REIC application windows.
 * Keeps controls inside an already-open dialog untouched.
 */
(()=>{'use strict';
if(window.PB_REIC_DESKTOP_CLICK_BRIDGE)return;
window.PB_REIC_DESKTOP_CLICK_BRIDGE=true;
const API=()=>window.PB_REIC_25_MODAL;
const host=()=>document.querySelector('#vmDesktop')||document.querySelector('.vm-shell');
const route={
 settings:'config',studio:'infra',documents:'editor',search:'search',files:'files',apps:'apps',
 display:'themes',status:'dashboard',notifications:'notifications',account:'users',
 network:'network',security:'security',storage:'storage',terminal:'terminal',help:'help',
 history:'history',backup:'backup',integrations:'integrations',git:'git',pages:'pages',
 explorer:'explorer',editor:'editor',generator:'generator',blocks:'blocks',layouts:'layouts',
 infra:'infra',config:'config',themes:'themes',monitor:'monitor',users:'users'
};
const aliases=[
 [/file\s*manager|filemanajer|berkas/i,'files'],
 [/reic\s*explorer|explorer/i,'explorer'],
 [/editor|kode|code/i,'editor'],
 [/generator/i,'generator'],
 [/list\s*blok|blok/i,'blocks'],
 [/layout\s*library|layout/i,'layouts'],
 [/infrastruktur|infrastructure|registri|registry/i,'infra'],
 [/pengaturan|konfigurasi|settings/i,'config'],
 [/tema|wallpaper|galeri|display/i,'themes'],
 [/notifikasi/i,'notifications'],
 [/terminal|shell|konsol/i,'terminal'],
 [/monitor|status\s*sistem/i,'monitor'],
 [/jaringan|network/i,'network'],
 [/keamanan|security|privasi/i,'security'],
 [/pengguna|akun|profil|users/i,'users'],
 [/penyimpanan|storage/i,'storage'],
 [/pencarian|search/i,'search'],
 [/riwayat|history/i,'history'],
 [/cadangan|backup/i,'backup'],
 [/integrasi|integration/i,'integrations'],
 [/git|repositori|repository/i,'git'],
 [/pages|publikasi/i,'pages'],
 [/bantuan|help/i,'help'],
 [/dashboard|beranda|pusat\s*sistem/i,'dashboard'],
 [/aplikasi|apps/i,'apps']
];
function infer(el){
 const core=el.closest('[data-core]')?.dataset.core;
 if(core&&route[core])return route[core];
 const opened=el.closest('[data-open]')?.dataset.open;
 if(opened&&route[opened])return route[opened];
 if(el.closest('[data-registry]'))return 'infra';
 if(el.closest('[data-code-container]'))return 'editor';
 const app=el.closest('[data-app-launch]')?.dataset.appLaunch;
 if(app&&API()?.apps?.some(x=>x.id===app))return app;
 const label=[el.getAttribute('aria-label'),el.getAttribute('title'),el.innerText,el.textContent].filter(Boolean).join(' ').trim();
 for(const [pattern,id] of aliases)if(pattern.test(label))return id;
 return null;
}
function handle(event){
 const root=host();if(!root||!root.contains(event.target))return;
 if(event.target.closest('.pb25-window,[role="dialog"],.vm-modal,.vm-modal-backdrop,.pb-catalog-backdrop'))return;
 const control=event.target.closest('button,a,[role="button"],[data-core],[data-open],[data-registry],[data-code-container],[data-app-launch],[data-modal-open]');
 if(!control||!root.contains(control))return;
 const id=control.dataset.modalOpen||infer(control);
 if(!id)return;
 const api=API();
 if(!api||typeof api.open!=='function')return;
 event.preventDefault();
 event.stopPropagation();
 if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
 api.open(id);
}
const install=()=>{
 const root=host();if(!root||root.dataset.pbClickBridge==='ready')return;
 root.dataset.pbClickBridge='ready';
 root.addEventListener('click',handle,true);
};
install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',install,{once:true});
window.PB_REIC_OPEN_DESKTOP_MODAL=id=>{if(API()?.open){API().open(route[id]||id);return true;}return false;};
})();