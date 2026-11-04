/* VMDESKTOPREIC · floating File Manager-style application windows */
(()=>{'use strict';
if(window.PB_REIC_FLOATING_WINDOWS)return;
window.PB_REIC_FLOATING_WINDOWS=true;
const css=`
#vmDesktop .vm-modal-backdrop{position:absolute!important;inset:0!important;display:block!important;padding:0!important;overflow:hidden!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;pointer-events:none!important;z-index:1000!important}
#vmDesktop .vm-modal-backdrop[hidden],#vmDesktop .pb-filemanajer-window[hidden]{display:none!important}
#vmDesktop .vm-modal-backdrop>.vm-modal{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:min(1180px,calc(100% - 28px))!important;height:min(760px,calc(100% - 28px))!important;max-width:calc(100% - 28px)!important;max-height:calc(100% - 28px)!important;min-height:0!important;margin:0!important;pointer-events:auto!important;overflow:hidden!important;border:1px solid #83e1ff!important;border-radius:0!important;color:#eaf4ff!important;background-color:#081522!important;background-image:radial-gradient(ellipse at 76% 0%,rgba(35,83,120,.28),transparent 48%),linear-gradient(rgba(131,225,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(131,225,255,.055) 1px,transparent 1px)!important;background-size:auto,28px 28px,28px 28px!important;box-shadow:0 18px 48px #0009!important}
#vmDesktop .vm-modal>header{cursor:grab!important;touch-action:none!important;user-select:none!important;background:linear-gradient(100deg,#10263b,#091522)!important;border-bottom:1px solid #31536b!important;color:#eaf4ff!important}
#vmDesktop .vm-modal>header:active{cursor:grabbing!important}
#vmDesktop .vm-modal>header>span{background:#10243a!important;border:1px solid #31536b!important;color:#83e1ff!important}
#vmDesktop .vm-modal>header button,#vmDesktop .vm-modal .modal-tabs button,#vmDesktop .vm-modal>footer button{border:1px solid #31536b!important;border-radius:0!important;background:#10243a!important;color:#dff7ff!important}
#vmDesktop .vm-modal .modal-tabs{background:#0b1929!important;border-bottom:1px solid #29445d!important}
#vmDesktop .vm-modal .modal-tabs button.active{background:#17405a!important;border-color:#83e1ff!important;color:#fff!important}
#vmDesktop .vm-modal .modal-body{background-color:rgba(7,17,31,.76)!important;background-image:linear-gradient(rgba(131,225,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(131,225,255,.035) 1px,transparent 1px)!important;background-size:28px 28px!important;color:#dceeff!important}
#vmDesktop .vm-modal .modal-body :is(.system-card,.content-card,.settings-group,.info-row,.setting-row,.menu-choice,.menu-choice-intro,.pb-core-intro,.pb-menu-overview,.pb-core-module,.registry-item,.registry-detail,.component-registry,.registry-controls,.registry-heading,.content-panel,.app-card,.system-panel,.settings-panel){border:1px solid #31536b!important;border-radius:0!important;background:linear-gradient(145deg,rgba(16,36,58,.96),rgba(7,19,33,.96))!important;color:#dceeff!important;box-shadow:inset 0 1px #ffffff0b!important}
#vmDesktop .vm-modal .modal-body :is(h1,h2,h3,h4,b,strong){color:#eaf7ff}
#vmDesktop .vm-modal .modal-body :is(p,small,label,li,span){color:inherit}
#vmDesktop .vm-modal .modal-body :is(input,select,textarea){background:#061321!important;border:1px solid #31536b!important;border-radius:0!important;color:#eaf4ff!important}
#vmDesktop .vm-modal .modal-body :is(button,[role=button]){border-radius:0!important}
#vmDesktop .vm-modal>footer{background:#091625!important;border-top:1px solid #29445d!important;color:#9db5cc!important}
#vmDesktop .pb-filemanajer-window{position:absolute!important;inset:0!important;display:block!important;padding:0!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;pointer-events:none!important;overflow:hidden!important;z-index:1100!important}
#vmDesktop .pb-filemanajer-window>.pfm-window{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:min(1180px,calc(100% - 28px))!important;height:min(760px,calc(100% - 28px))!important;max-width:calc(100% - 28px)!important;max-height:calc(100% - 28px)!important;min-height:0!important;margin:0!important;pointer-events:auto!important;border:1px solid #83e1ff!important;border-radius:0!important;background-color:#081522!important;background-image:radial-gradient(ellipse at 76% 0%,rgba(35,83,120,.28),transparent 48%),linear-gradient(rgba(131,225,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(131,225,255,.055) 1px,transparent 1px)!important;background-size:auto,28px 28px,28px 28px!important;box-shadow:0 18px 48px #0009!important}
#vmDesktop .pfm-window>.pfm-head{cursor:grab!important;touch-action:none!important;user-select:none!important;background:linear-gradient(100deg,#10263b,#091522)!important;border-bottom:1px solid #31536b!important}
#vmDesktop .pfm-window>.pfm-head:active{cursor:grabbing!important}
#vmDesktop .pfm-window .pfm-app-host{background:rgba(7,17,31,.78)!important;background-image:linear-gradient(rgba(131,225,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(131,225,255,.035) 1px,transparent 1px)!important;background-size:28px 28px!important}
#vmDesktop .pfm-window .pfm-sidepanel{background:linear-gradient(160deg,#10243a,#081522)!important;border-left:1px solid #29445d!important}
#vmDesktop .pfm-window :is(button,input,select,textarea){border-radius:0!important}
#vmDesktop .vm-modal-backdrop .vm-modal.is-floating-active,#vmDesktop .pfm-window.is-floating-active{outline:1px solid #83e1ff!important}
@media(max-width:700px){#vmDesktop .vm-modal-backdrop>.vm-modal{width:calc(100% - 12px)!important;height:min(78vh,760px)!important;max-height:calc(100% - 12px)!important}#vmDesktop .pb-filemanajer-window>.pfm-window{width:calc(100% - 12px)!important;height:min(78vh,760px)!important;max-height:calc(100% - 12px)!important}}
`;
const style=document.createElement('style');style.id='pb-reic-floating-window-theme';style.textContent=css;document.head.append(style);
const desktop=document.querySelector('#vmDesktop');if(!desktop)return;
let z=1200;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function makeDraggable(win,handle,container){
 if(!win||!handle||win.dataset.floatReady==='1')return;
 win.dataset.floatReady='1';
 const center=()=>{const p=container.getBoundingClientRect(),w=win.getBoundingClientRect();win.style.left=(p.width-w.width)/2+'px';win.style.top=(p.height-w.height)/2+'px';win.style.transform='none';};
 const raise=()=>{win.style.zIndex=String(++z);win.classList.add('is-floating-active');desktop.querySelectorAll('.is-floating-active').forEach(el=>{if(el!==win)el.classList.remove('is-floating-active');});};
 const down=e=>{
  if(e.button!==undefined&&e.button!==0)return;
  if(e.target.closest('button,a,input,select,textarea,[contenteditable=true]'))return;
  const p=container.getBoundingClientRect(),r=win.getBoundingClientRect();
  if(win.dataset.floatPositioned!=='1'){win.style.left=(r.left-p.left)+'px';win.style.top=(r.top-p.top)+'px';win.style.transform='none';win.dataset.floatPositioned='1';}
  const startX=e.clientX,startY=e.clientY,left=parseFloat(win.style.left)||0,top=parseFloat(win.style.top)||0;
  const move=ev=>{const maxX=Math.max(0,container.clientWidth-win.offsetWidth),maxY=Math.max(0,container.clientHeight-win.offsetHeight);win.style.left=clamp(left+ev.clientX-startX,-win.offsetWidth+90,maxX)+'px';win.style.top=clamp(top+ev.clientY-startY,0,maxY)+'px';};
  const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);};
  raise();try{handle.setPointerCapture?.(e.pointerId);}catch(_){}
  document.addEventListener('pointermove',move);document.addEventListener('pointerup',end,{once:true});document.addEventListener('pointercancel',end,{once:true});e.preventDefault();
 };
 handle.addEventListener('pointerdown',down);
 win.addEventListener('pointerdown',raise);
 win.dataset.floatPositioned='0';
}
function scan(){
 desktop.querySelectorAll('.vm-modal-backdrop>.vm-modal').forEach(win=>{
  const parent=win.parentElement,handle=win.querySelector(':scope > header');
  if(parent&&!win.dataset.floatReady){makeDraggable(win,handle,parent);}
 });
 desktop.querySelectorAll('.pb-filemanajer-window>.pfm-window').forEach(win=>{
  const parent=win.parentElement,handle=win.querySelector(':scope > .pfm-head');
  if(parent&&!win.dataset.floatReady){makeDraggable(win,handle,parent);}
 });
 desktop.querySelectorAll('[data-floating-window]').forEach(win=>{
  const handle=win.querySelector('[data-window-drag-handle]')||win.querySelector('header');
  if(handle&&!win.dataset.floatReady)makeDraggable(win,handle,win.parentElement||desktop);
 });
}
new MutationObserver(scan).observe(desktop,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});
scan();
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const picker=document.querySelector('#desktopLayoutPicker');if(picker)picker.hidden=true;}});
window.PB_REIC_FLOATING_WINDOWS_SCAN=scan;
})();