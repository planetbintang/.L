/* FILEMANAJER.AKC — draggable VMDESKTOPREIC application shell */
(()=>{'use strict';
 if(window.PB_FILEMANAJER_APP)return;
 const root=document.querySelector('#vmDesktop');if(!root)return;
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const launcher=document.createElement('button');
 launcher.type='button';launcher.id='pbFilemanajerShortcut';launcher.className='pb-filemanajer-shortcut';
 launcher.innerHTML='<span>▱</span><b>FILEMANAJER</b>';launcher.title='Buka aplikasi Filemanajer';launcher.setAttribute('aria-label','Buka aplikasi Filemanajer');
 root.querySelector('.vm-desktop')?.append(launcher);
 const shortcutStyle=document.createElement('link');shortcutStyle.rel='stylesheet';shortcutStyle.href='./filemanager-app.reicss';document.head.append(shortcutStyle);
 const win=document.createElement('section');win.id='pbFilemanajerWindow';win.className='pb-filemanajer-window';win.hidden=true;
 win.innerHTML='<header class="pfm-head"><span class="pfm-mark">▱</span><div class="pfm-brand"><b>FILEMANAJER</b><small>VMDESKTOPREIC · PACKAGE filemanajer.akc</small></div><div class="pfm-modes"><button data-mode="deploy">DEPLOY</button><button data-mode="filter">FILTER</button><button data-mode="pipeline">PIPELINE</button><button data-mode="monitoring">MONITORING</button></div><button class="pfm-run" data-action="run">▶ RUN</button><button class="pfm-build" data-action="build">BUILD</button><button class="pfm-min" aria-label="Minimalkan">—</button><button class="pfm-close" aria-label="Tutup">×</button></header><div class="pfm-body"><div class="pfm-app-host"><div class="pfm-loading">Memuat aplikasi Filemanajer…</div></div><aside class="pfm-sidepanel"><b id="pfmPanelTitle">PIPELINE CONTROL</b><div id="pfmPanelContent"><p>RUN dan BUILD menjalankan pemeriksaan lokal terhadap ruang kerja Filemanajer.</p></div><div class="pfm-log" id="pfmLog" aria-live="polite">RUNTIME SIAP · MENUNGGU PERINTAH</div></aside></div><footer class="pfm-foot"><span id="pfmState">APPLICATION READY</span><span>LOCAL REIC RUNTIME · BACKEND CONNECTOR BELUM DIKONFIGURASI</span></footer>';
 const frameShell=document.createElement('div');frameShell.className='pfm-window';while(win.firstChild)frameShell.append(win.firstChild);win.append(frameShell);root.append(win);
 const host=win.querySelector('.pfm-app-host'),log=win.querySelector('#pfmLog'),panelTitle=win.querySelector('#pfmPanelTitle'),panel=win.querySelector('#pfmPanelContent'),state=win.querySelector('#pfmState');
 const say=(s)=>{log.textContent=new Date().toLocaleTimeString('id-ID')+' · '+s;state.textContent=s.toUpperCase();};
 let loaded=false,mode='pipeline';
 async function load(){
  if(loaded)return;
  try{
   const packageResponse=await fetch('./filemanajer.akc',{cache:'force-cache'});if(!packageResponse.ok)throw Error('filemanajer.akc HTTP '+packageResponse.status);
   const manifest=await packageResponse.json();
   for(const field of ['entry','view','style','applicationStyle','engine'])if(!manifest[field])throw Error('Manifest aplikasi tidak lengkap: '+field);
   if(manifest.name!=='filemanajer'||manifest.runtime!=='VMDESKTOPREIC-REIC')throw Error('Identitas package filemanajer tidak cocok');
   const css=document.createElement('link');css.rel='stylesheet';css.href='./'+manifest.style;css.dataset.filemanajer='';document.head.append(css);
   const appCss=document.createElement('link');appCss.rel='stylesheet';appCss.href='./'+manifest.applicationStyle+'?v=20261104-filemanajer-modal-5';appCss.dataset.filemanajerApp='';document.head.append(appCss);
   const response=await fetch('./'+manifest.view,{cache:'force-cache'});if(!response.ok)throw Error(manifest.view+' HTTP '+response.status);
   const source=await response.text(),a=source.indexOf('<section'),b=source.lastIndexOf('</section>');
   if(a<0||b<a)throw Error('Bagian aplikasi REIC tidak ditemukan');
   host.innerHTML=source.slice(a,b+10);
   await new Promise((resolve,reject)=>{if(window.initPlanetFileManager)return resolve();const s=document.createElement('script');s.src='./'+manifest.engine+'?v=20261104-code-tree-2';s.onload=resolve;s.onerror=()=>reject(Error(manifest.engine+' gagal dimuat'));document.body.append(s);});
   window.initPlanetFileManager('Beranda File');
   loaded=true;say('FILEMANAGER MOUNTED · STORAGE LOKAL');
  }catch(e){host.innerHTML='<p class="pfm-error">'+esc(e.message)+'</p>';say('LOAD ERROR · '+e.message);}
 }
 function open(){win.hidden=false;win.classList.add('is-open');load();say('APLIKASI DIBUKA');}
 function close(){win.hidden=true;win.classList.remove('is-open');}
 launcher.style.left='50%';launcher.style.top='58%';launcher.style.transform='translate(-50%,-50%)';launcher.style.zIndex='6';
 let iconDrag=null;
 launcher.addEventListener('pointerdown',e=>{if(e.button!==0)return;const rect=launcher.getBoundingClientRect();const scale=root.getBoundingClientRect().width/(root.offsetWidth||1920);iconDrag={x:e.clientX-rect.left,y:e.clientY-rect.top,scale:scale||1};launcher.setPointerCapture(e.pointerId);});
 launcher.addEventListener('pointermove',e=>{if(!iconDrag)return;const bounds=root.querySelector('.vm-desktop').getBoundingClientRect();const x=(e.clientX-bounds.left-iconDrag.x)/iconDrag.scale;const y=(e.clientY-bounds.top-iconDrag.y)/iconDrag.scale;launcher.style.transform='none';launcher.style.left=Math.max(0,Math.min(1800,x))+'px';launcher.style.top=Math.max(0,Math.min(900,y))+'px';});
 launcher.addEventListener('pointerup',()=>iconDrag=null);launcher.addEventListener('pointercancel',()=>iconDrag=null);
 launcher.addEventListener('click',open);
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-core="files"]');
  if(b){e.preventDefault();e.stopImmediatePropagation();open();}
  const t=e.target.closest('[data-open="files"]');
  if(t){e.preventDefault();e.stopImmediatePropagation();open();}
  const shortcut=e.target.closest('[data-app-id="app-filemanajer"],[data-app-id="app-5"]');
  if(shortcut&&e.detail>0){e.preventDefault();e.stopImmediatePropagation();open();}
 },true);
 win.querySelector('.pfm-close').addEventListener('click',close);
 win.querySelector('.pfm-min').addEventListener('click',close);
 const modes={
  deploy:['DEPLOY CONTROL','<p>Siapkan paket dan validasi manifest sebelum deployment.</p><button data-action="preflight">VALIDASI DEPLOY</button><p class="pfm-note">Deployment ke server memerlukan endpoint dan kredensial backend yang belum terpasang.</p>'],
  filter:['FILTER ENGINE','<label>Nama berkas<input id="pfmFilter" placeholder="Cari nama berkas atau folder…"></label><button data-action="apply-filter">TERAPKAN FILTER</button><p class="pfm-note">Filter mengarahkan fokus ke kolom pencarian Filemanajer.</p>'],
  pipeline:['PIPELINE CONTROL','<ol><li>Inspect package</li><li>Filter workspace</li><li>Build local report</li><li>Run validation</li><li>Deploy readiness</li></ol><button data-action="run">▶ RUN PIPELINE</button><button data-action="build">BUILD REPORT</button>'],
  monitoring:['MONITORING','<p id="pfmMetrics">Status runtime: siap<br>Package: filemanajer.akc<br>Mode: browser-local</p><button data-action="refresh-monitor">REFRESH MONITOR</button>']
 };
 function setMode(next){mode=next;win.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===next));panelTitle.textContent=modes[next][0];panel.innerHTML=modes[next][1];}
 win.querySelector('.pfm-modes').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)setMode(b.dataset.mode);});
 async function runBuild(kind){
  await load();const report={package:'filemanajer.akc',action:kind,startedAt:new Date().toISOString(),checks:[],result:'PASS_LOCAL'};
  report.checks.push({name:'package manifest',ok:true,detail:'filemanajer.akc terdaftar'});
  report.checks.push({name:'REIC view',ok:!!host.querySelector('#fileManagerApp'),detail:host.querySelector('#fileManagerApp')?'view terpasang':'view belum terpasang'});
  report.checks.push({name:'browser storage',ok:typeof localStorage!=='undefined',detail:'penyimpanan browser'});
  report.checks.push({name:'remote backend',ok:false,detail:'belum dikonfigurasi; deploy remote tidak dijalankan'});
  report.result=report.checks.every(x=>x.ok)&&kind==='run'?'PASS_LOCAL':'READY_LOCAL_ONLY';
  try{const key='pb-filemanajer-pipeline-history';const rows=JSON.parse(localStorage.getItem(key)||'[]');rows.unshift(report);localStorage.setItem(key,JSON.stringify(rows.slice(0,30)));}catch(_){}
  say(kind.toUpperCase()+' SELESAI · '+report.result+' · '+report.checks.filter(x=>x.ok).length+'/'+report.checks.length+' CHECK');
  panelTitle.textContent=kind.toUpperCase()+' REPORT';
  panel.innerHTML='<p><b>'+report.result+'</b></p>'+report.checks.map(x=>'<p class="pfm-check '+(x.ok?'ok':'warn')+'">'+(x.ok?'✓':'!')+' '+esc(x.name)+' — '+esc(x.detail)+'</p>').join('')+'<p class="pfm-note">RUN/BUILD memeriksa dan menyiapkan artefak lokal. Tidak ada deployment server yang diklaim atau dijalankan.</p>';
 }
 win.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  if(b.dataset.action==='run'||b.dataset.action==='build'){runBuild(b.dataset.action);return;}
  if(b.dataset.action==='preflight'){runBuild('deploy-preflight');return;}
  if(b.dataset.action==='refresh-monitor'){setMode('monitoring');say('MONITOR DIPERBARUI · '+(loaded?'RUNTIME AKTIF':'BELUM DIMUAT'));return;}
  if(b.dataset.action==='apply-filter'){const q=win.querySelector('#pfmFilter')?.value||'';const input=host.querySelector('#fmSearch');if(input){input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));say('FILTER DITERAPKAN');}}
 });
 const head=win.querySelector('.pfm-head'),frame=win.querySelector('.pfm-window');let drag=null;
 head.addEventListener('pointerdown',e=>{if(e.target.closest('button,input'))return;const rect=frame.getBoundingClientRect();drag={x:e.clientX-rect.left,y:e.clientY-rect.top};head.setPointerCapture(e.pointerId);});
 head.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(0,Math.min(innerWidth-frame.offsetWidth,e.clientX-drag.x));const y=Math.max(0,Math.min(innerHeight-55,e.clientY-drag.y));frame.style.position='absolute';frame.style.left=x+'px';frame.style.top=y+'px';frame.style.margin='0';});
 head.addEventListener('pointerup',()=>drag=null);head.addEventListener('pointercancel',()=>drag=null);
 setMode('pipeline');
 window.PB_FILEMANAJER_APP=Object.freeze({open,close,run:()=>runBuild('run'),build:()=>runBuild('build'),get status(){return loaded?'ready':'not-loaded';}});
 root.dataset.filemanajerPackage='installed';
})();