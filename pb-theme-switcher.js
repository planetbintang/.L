(()=>{"use strict";const KEY="planetbintang-display-theme";const root=document.documentElement;const choices=[{value:"abstract-dark",label:"GELAP ABSTRAK"},{value:"water-glass",label:"CAHAYA AIR KACA"}];let saved="";try{saved=localStorage.getItem(KEY)||""}catch{}function apply(value){if(value==="water-glass")root.setAttribute("data-pb-theme",value);else root.removeAttribute("data-pb-theme");try{localStorage.setItem(KEY,value)}catch{}const select=document.getElementById("pbThemeChoice");if(select)select.value=value}if(saved==="water-glass")apply(saved);else root.removeAttribute("data-pb-theme");function mount(){if(document.getElementById("pbThemeSwitcher"))return;const wrap=document.createElement("label");wrap.id="pbThemeSwitcher";wrap.className="pb-theme-switcher";wrap.innerHTML='<span>TEMA TAMPILAN</span><select id="pbThemeChoice" aria-label="Pilih tema tampilan"><option value="abstract-dark">GELAP ABSTRAK</option><option value="water-glass">CAHAYA AIR KACA</option></select>';document.body.appendChild(wrap);const select=wrap.querySelector("select");select.value=saved==="water-glass"?"water-glass":"abstract-dark";select.addEventListener("change",()=>apply(select.value))}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount()})();
/* Typography integrity: use the real font glyph for every R/r character.
   The former custom SVG overlay is intentionally retired because it changed
   glyph proportions and could collide with adjacent characters. */
(()=>{"use strict";
 const selectors=".reic-r-letter";
 function restore(root){
  if(!root)return;
  const wrappers=[];
  if(root.nodeType===Node.ELEMENT_NODE&&root.matches?.(selectors))wrappers.push(root);
  root.querySelectorAll?.(selectors).forEach(el=>wrappers.push(el));
  wrappers.forEach(el=>{
   const source=el.querySelector(".reic-r-source");
   const letter=source?.textContent||el.getAttribute("data-letter")||"R";
   el.replaceWith(document.createTextNode(letter));
  });
  if(root.nodeType===Node.TEXT_NODE)return;
 }
 function start(){
  restore(document.body);
  const observer=new MutationObserver(records=>{
   for(const record of records)for(const node of record.addedNodes){
    if(node.nodeType===Node.ELEMENT_NODE)restore(node);
   }
  });
  observer.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
