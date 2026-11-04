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