/* VMDESKTOPREIC · enforce one visible application window at a time */
(()=>{'use strict';
if(window.PB_REIC_SINGLE_LAYER)return;
const desktop=document.querySelector('#vmDesktop');if(!desktop)return;
const selector='.vm-modal-backdrop,.pb-filemanajer-window,#pbCatalogBackdrop,#pbAppWindowLayer,#pbDesktopSearchLayer,.pb25-window';
const muted='data-reic-layer-muted';
let active=null,queued=false;
const visible=el=>!!el&&!el.hasAttribute('hidden')&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getAttribute('aria-hidden')!=='true';
function candidates(){return [...desktop.querySelectorAll(selector)].filter(el=>visible(el)&&!el.hasAttribute(muted));}
function apply(preferred){const all=[...desktop.querySelectorAll(selector)];let target=preferred&&visible(preferred)?preferred:null;if(!target){const shown=candidates();target=shown[shown.length-1]||null;}all.forEach(el=>{if(el===target)el.removeAttribute(muted);else el.setAttribute(muted,'1');});active=target;if(target){target.style.zIndex=String(700);target.dataset.reicSingleLayer='active';}desktop.dataset.reicActiveWindow=target?.id||target?.classList[0]||'none';}
function schedule(preferred){if(preferred)active=preferred;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply(active);});}
const observer=new MutationObserver(records=>{let preferred=null;for(const rec of records){const t=rec.target.nodeType===1?rec.target:rec.target.parentElement;const found=t?.closest?.(selector);if(found&&visible(found))preferred=found;for(const node of rec.addedNodes||[]){if(node.nodeType!==1)continue;const foundNode=node.matches?.(selector)?node:node.querySelector?.(selector);if(foundNode&&visible(foundNode))preferred=foundNode;}}schedule(preferred);});
observer.observe(desktop,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class','aria-hidden']});
desktop.addEventListener('pointerdown',e=>{const w=e.target.closest(selector);if(w&&visible(w))schedule(w);},true);
desktop.addEventListener('click',e=>{const open=e.target.closest('[data-open],[data-core],.pb-app-shortcut,[data-app-tab]');if(open){const w=open.closest(selector);if(w)schedule(w);}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){if(active.matches('#pbDesktopSearchLayer'))active.hidden=true;else if(active.matches('.pb-filemanajer-window,#pbCatalogBackdrop,#pbAppWindowLayer,.vm-modal-backdrop'))active.hidden=true;else if(active.matches('.pb25-window'))active.remove();schedule(null);}});
window.PB_REIC_SINGLE_LAYER=Object.freeze({activate:el=>{if(typeof el==='string')el=desktop.querySelector(el);if(el)schedule(el);},get active(){return active;}});
apply(null);
})();