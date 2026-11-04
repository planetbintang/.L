/* VMDESKTOPREIC · CENTRAL SEARCH MODAL · multi-provider web search */
(()=>{'use strict';
 if(window.PB_DESKTOP_SEARCH)return;
 const root=document.querySelector('#vmDesktop');if(!root)return;
 const providers=[
  {id:'google',name:'GOOGLE',url:q=>'https://www.google.com/search?q='+encodeURIComponent(q)},
  {id:'duckduckgo',name:'DUCKDUCKGO',url:q=>'https://duckduckgo.com/?q='+encodeURIComponent(q)},
  {id:'bing',name:'BING',url:q=>'https://www.bing.com/search?q='+encodeURIComponent(q)},
  {id:'brave',name:'BRAVE',url:q=>'https://search.brave.com/search?q='+encodeURIComponent(q)},
  {id:'ecosia',name:'ECOSIA',url:q=>'https://www.ecosia.org/search?q='+encodeURIComponent(q)},
  {id:'yahoo',name:'YAHOO',url:q=>'https://search.yahoo.com/search?p='+encodeURIComponent(q)}
 ];
 const types=[['web','WEB'],['images','GAMBAR'],['videos','VIDEO'],['news','BERITA'],['maps','PETA']];
 const layer=document.createElement('div');layer.id='pbDesktopSearchLayer';layer.hidden=true;
 layer.innerHTML='<section class="pb-search-window" role="dialog" aria-modal="true" aria-labelledby="pbSearchTitle"><header class="pb-search-head"><span>⌕</span><div><h2 id="pbSearchTitle">PENCARIAN UTAMA</h2><small>VMDESKTOPREIC · MULTI SEARCH PROVIDER</small></div><button type="button" data-search-close>TUTUP ×</button></header><form class="pb-search-form"><input id="pbSearchQuery" type="search" autocomplete="off" placeholder="Masukkan kata kunci, alamat, atau topik…" aria-label="Kata kunci pencarian"><button type="submit">CARI ↗</button></form><nav class="pb-search-types" aria-label="Jenis pencarian">'+types.map((x,i)=>'<button type="button" data-search-type="'+x[0]+'" class="'+(i===0?'active':'')+'">'+x[1]+'</button>').join('')+'</nav><nav class="pb-search-providers" aria-label="Penyedia pencarian">'+providers.map((x,i)=>'<button type="button" data-search-provider="'+x.id+'" class="'+(i===0?'active':'')+'">'+x.name+'</button>').join('')+'</nav><div class="pb-search-result-head"><b id="pbSearchCaption">HASIL PENCARIAN WEB</b><a id="pbSearchOpen" target="_blank" rel="noopener noreferrer" href="https://www.google.com">BUKA DI TAB BARU ↗</a></div><div class="pb-search-frame-wrap"><iframe id="pbSearchFrame" title="Hasil pencarian eksternal" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe><div class="pb-search-fallback"><b>Jika penyedia tidak mengizinkan tampilan di dalam jendela:</b><span>Gunakan tautan “BUKA DI TAB BARU” untuk melihat hasil pencarian lengkap.</span></div></div><footer class="pb-search-foot"><span>Google · DuckDuckGo · Bing · Brave · Ecosia · Yahoo</span><span>Hasil berasal dari penyedia eksternal</span></footer></section>';
 const style=document.createElement('style');style.textContent=`
#pbDesktopSearchLayer{position:absolute;inset:0;width:100%;height:100%;z-index:180;display:grid;place-items:center;padding:clamp(7px,2vw,28px);box-sizing:border-box;background:linear-gradient(135deg,#001b62b8,#0055c99c);backdrop-filter:blur(6px);overflow:auto}
#pbDesktopSearchLayer[hidden]{display:none!important}
.pb-search-window{width:min(1500px,calc(100% - 42px));height:min(850px,calc(100% - 42px));max-height:calc(100% - 42px);min-height:min(500px,calc(100% - 42px));display:flex;flex-direction:column;overflow:hidden;border:3px solid #f0fcff;border-radius:4px;background:linear-gradient(145deg,#eaf8ff,#c9eaff 48%,#f5fcff);color:#07346c;box-shadow:0 18px 70px #001a63a8,inset 0 0 0 2px #4cbaff}
.pb-search-head{display:flex;align-items:center;gap:14px;min-height:66px;padding:10px 16px;background:linear-gradient(100deg,#0874df,#36b6ff 56%,#0751c6);color:white}
.pb-search-head>span{font-size:30px}.pb-search-head>div{flex:1}.pb-search-head h2{margin:0;font-size:18px}.pb-search-head small{font-size:10px;letter-spacing:.12em}.pb-search-head button,.pb-search-form button{border:1px solid #d8f5ff;background:linear-gradient(#67caff,#0758c9);color:white;padding:10px 14px;cursor:pointer}
.pb-search-form{display:flex;gap:8px;padding:14px;background:#e0f3ff}.pb-search-form input{flex:1;min-width:0;padding:13px;border:1px solid #76bce9;background:white;color:#07346c;font-size:15px}
.pb-search-types,.pb-search-providers{display:flex;gap:7px;flex-wrap:wrap;padding:9px 14px;background:#f5fbff;border-bottom:1px solid #a9ddfa}
.pb-search-types button,.pb-search-providers button{padding:8px 12px;border:1px solid #71b9eb;background:linear-gradient(#fff,#cceaff);color:#07509a;font-weight:700;cursor:pointer}
.pb-search-types button.active,.pb-search-providers button.active{background:linear-gradient(#0d8ff0,#0751bd);color:white}
.pb-search-result-head{display:flex;justify-content:space-between;gap:10px;padding:10px 16px;background:#d8f2ff;color:#07509a;font-size:11px}
.pb-search-result-head a{color:#07509a;font-weight:700}.pb-search-frame-wrap{position:relative;flex:1;min-height:0;background:white}
#pbSearchFrame{width:100%;height:100%;border:0;background:white}.pb-search-fallback{position:absolute;left:12px;right:12px;bottom:10px;display:flex;flex-direction:column;gap:3px;padding:8px 10px;background:#eaf6ffdd;border:1px solid #a9d8f5;color:#24577d;font-size:10px;pointer-events:none}
.pb-search-foot{display:flex;justify-content:space-between;gap:8px;padding:9px 14px;background:#e2f4ff;border-top:1px solid #a9ddfa;color:#07509a;font-size:10px}
@media(max-width:700px){#pbDesktopSearchLayer{padding:7px}.pb-search-window{width:calc(100vw - 14px);height:calc(100dvh - 14px);max-height:calc(100dvh - 14px);min-height:0}.pb-search-form{padding:8px}.pb-search-types,.pb-search-providers{gap:4px;padding:6px}.pb-search-types button,.pb-search-providers button{padding:7px;font-size:9px}.pb-search-foot{font-size:8px}}
`;document.head.append(style);
 root.append(layer);
 const input=layer.querySelector('#pbSearchQuery'),frame=layer.querySelector('#pbSearchFrame'),open=layer.querySelector('#pbSearchOpen'),caption=layer.querySelector('#pbSearchCaption');
 let provider='google',type='web',lastQuery='';
 const typeQuery=(q)=>type==='images'?q+' images':type==='videos'?q+' videos':type==='news'?q+' news':type==='maps'?q+' map location':q;
 function search(q=input.value){q=String(q||'').trim();if(!q){input.focus();return}lastQuery=q;input.value=q;const p=providers.find(x=>x.id===provider)||providers[0];let url=p.url(typeQuery(q));if(provider==='google'&&type!=='web')url='https://www.google.com/search?tbm='+(type==='images'?'isch':type==='videos'?'vid':type==='news'?'nws':'lcl')+'&q='+encodeURIComponent(q);if(provider==='duckduckgo'&&type==='images')url='https://duckduckgo.com/?iax=images&ia=images&q='+encodeURIComponent(q);if(provider==='duckduckgo'&&type==='videos')url='https://duckduckgo.com/?iax=videos&ia=videos&q='+encodeURIComponent(q);if(provider==='duckduckgo'&&type==='news')url='https://duckduckgo.com/?iar=news&ia=news&q='+encodeURIComponent(q);open.href=url;caption.textContent='HASIL '+(types.find(x=>x[0]===type)?.[1]||'WEB')+' · '+p.name;frame.src=url;layer.hidden=false;input.focus();}
 function setProvider(id){provider=id;layer.querySelectorAll('[data-search-provider]').forEach(b=>b.classList.toggle('active',b.dataset.searchProvider===id));if(lastQuery)search(lastQuery);}
 function close(){layer.hidden=true;frame.src='about:blank';}
 layer.addEventListener('click',e=>{if(e.target===layer||e.target.closest('[data-search-close]'))close();const p=e.target.closest('[data-search-provider]');if(p)setProvider(p.dataset.searchProvider);const t=e.target.closest('[data-search-type]');if(t){type=t.dataset.searchType;layer.querySelectorAll('[data-search-type]').forEach(b=>b.classList.toggle('active',b===t));if(lastQuery)search(lastQuery);}});
 layer.querySelector('.pb-search-form').addEventListener('submit',e=>{e.preventDefault();search();});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-core="search"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();layer.hidden=false;input.focus();},{capture:true});
 document.addEventListener('keydown',e=>{if(e.target?.id==='centerSearch'&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();search(e.target.value);}if(e.key==='Escape'&&!layer.hidden)close();},{capture:true});
 window.PB_DESKTOP_SEARCH=Object.freeze({open:search,close,search,setProvider,get activeProvider(){return provider;}});
 root.dataset.searchModal='ready';
})();