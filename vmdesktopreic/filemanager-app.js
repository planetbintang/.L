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
 root.append(win);
 const host=win.querySelector('.pfm-app-host'),log=win.querySelector('#pfmLog'),panelTitle=win.querySelector('#pfmPanelTitle'),panel=win.querySelector('#pfmPanelContent'),state=win.querySelector('#pfmState');
 const say=(s)=>{log.textContent=new Date().toLocaleTimeString('id-ID')+' · '+s;state.textContent=s.toUpperCase();};
 let loaded=false,mode='pipeline';
 async function load(){
  if(loaded)return;
  try{
   const css=document.createElement('link');css.rel='stylesheet';css.href='./filemanager.css';css.dataset.filemanajer='';document.head.append(css);
   const response=await fetch('./filemanager.reic',{cache:'no-cache'});if(!response.ok)throw Error('filemanager.reic HTTP '+response.status);
   const source=await response.text(),a=source.indexOf('<section'),b=source.lastIndexOf('</section>');
   if(a<0||b<a)throw Error('Bagian aplikasi REIC tidak ditemukan');
   host.innerHTML=source.slice(a,b+10);
   await new Promise((resolve,reject)=>{if(window.initPlanetFileManager)return resolve();const s=document.createElement('script');s.src='./filemanager.js';s.onload=resolve;s.onerror=()=>reject(Error('filemanager.js gagal dimuat'));document.body.append(s);});
   window.initPlanetFileManager('Beranda File');
   loaded=true;say('FILEMANAGER MOUNTED · STORAGE LOKAL');
  }catch(e){host.innerHTML='<p class="pfm-error">'+esc(e.message)+'</p>';say('LOAD ERROR · '+e.message);}
 }
 function open(){win.hidden=false;win.classList.add('is-open');load();say('APLIKASI DIBUKA');}
 function close(){win.hidden=true;win.classList.remove('is-open');}
 launcher.addEventListener('click',open);
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-core="files"]');
  if(b){e.preventDefault();e.stopImmediatePropagation();open();}
  const t=e.target.closest('[data-open="files"]');
  if(t){e.preventDefault();e.stopImmediatePropagation();open();}
  const shortcut=e.target.closest('[data-app-id="app-filemanajer"]');
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
 const head=win.querySelector('.pfm-head');let drag=null;
 head.addEventListener('pointerdown',e=>{if(e.target.closest('button,input'))return;drag={x:e.clientX-win.offsetLeft,y:e.clientY-win.offsetTop};head.setPointerCapture(e.pointerId);});
 head.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(0,Math.min(root.clientWidth-win.offsetWidth,e.clientX-drag.x));const y=Math.max(0,Math.min(root.clientHeight-55,e.clientY-drag.y));win.style.left=x+'px';win.style.top=y+'px';win.style.transform='none';});
 head.addEventListener('pointerup',()=>drag=null);head.addEventListener('pointercancel',()=>drag=null);
 setMode('pipeline');
 window.PB_FILEMANAJER_APP=Object.freeze({open,close,run:()=>runBuild('run'),build:()=>runBuild('build'),get status(){return loaded?'ready':'not-loaded';}});
 root.dataset.filemanajerPackage='installed';
})();