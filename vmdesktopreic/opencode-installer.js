/* VMDESKTOPREIC · OpenCode installer bridge
 * Calls only the fixed local installer endpoint; no arbitrary shell input is accepted.
 */
(()=>{'use strict';
 if(window.VMOpenCodeInstaller)return;
 const API='http://127.0.0.1:43821';
 const $=(s,r=document)=>r.querySelector(s);
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const style=document.createElement('link');style.rel='stylesheet';style.href='./opencode-installer.css?v=20261108-1';document.head.append(style);
 let busy=false;
 function status(text,kind='info'){const el=$('#opencodeStatus');if(el){el.textContent=text;el.dataset.kind=kind;}}
 function log(text){const el=$('#opencodeLog');if(el)el.textContent=String(text||'').slice(-16000);}
 async function request(path,options={}){
  const response=await fetch(API+path,{...options,mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({ok:false,error:'Respons server bukan JSON.'}));
  if(!response.ok||data.ok===false)throw Error(data.error||('HTTP '+response.status));
  return data;
 }
 async function check(){
  status('Menghubungkan ke Shell Agent lokal…');
  try{const data=await request('/health');status(data.opencode?('OpenCode tersedia · '+data.version):'Shell Agent siap · OpenCode belum terpasang',data.opencode?'success':'ready');log(data.opencode?'Versi terpasang: '+data.version:'Shell Agent aktif. Tekan INSTALL OPENCODE untuk memulai instalasi resmi.');return data;}
  catch(error){status('Shell Agent belum terhubung', 'warning');log('Jalankan agent lokal pada mesin Linux yang akan menjalankan VMDESKTOPREIC:\nnode opencode-shell-agent.mjs\n\nDetail: '+error.message);return null;}
 }
 async function install(){
  if(busy)return;busy=true;const button=$('#opencodeInstall');if(button){button.disabled=true;button.textContent='MENGINSTAL…';}
  status('Menjalankan installer resmi OpenCode…');log('Perintah yang dijalankan oleh Shell Agent:\ncurl -fsSL https://opencode.ai/v2/install | bash\n\nMenunggu proses selesai…');
  try{const data=await request('/install/opencode',{method:'POST',body:'{}'});status('Instalasi selesai · '+data.version,'success');log((data.output||'Installer selesai.')+'\n\nVerifikasi: opencode --version\n'+data.version);}
  catch(error){status('Instalasi gagal atau belum selesai','error');log('Gagal: '+error.message+'\nPastikan mesin target memakai Linux/macOS, memiliki curl dan bash, serta akses internet.');}
  finally{busy=false;if(button){button.disabled=false;button.textContent='INSTALL OPENCODE';}}
 }
 function render(){
  const header=$('.vm-header-tools');if(header&&!$('#opencodeLauncher')){const b=document.createElement('button');b.id='opencodeLauncher';b.type='button';b.textContent='⌘';b.title='OpenCode Installer';b.setAttribute('aria-label','OpenCode Installer');b.addEventListener('click',open);header.append(b);}
  const launcher=$('#vmAppLauncher');if(launcher&&!launcher.querySelector('[data-open="opencode-installer"]')){const b=document.createElement('button');b.className='vm-app';b.dataset.vmOpencode='true';b.innerHTML='<span class="app-icon app-dark">⌘</span><b>OpenCode</b>';b.addEventListener('click',open);launcher.append(b);}
 }
 function open(){
  const backdrop=$('#modalBackdrop'),title=$('#modalTitle'),icon=$('#modalIcon'),tabs=$('#modalTabs'),body=$('#modalBody'),statusBar=$('#modalStatus');
  if(!backdrop||!body)return;
  if(title)title.textContent='OPENCODE · INSTALLER';if(icon)icon.textContent='⌘';if(tabs)tabs.innerHTML='<button class="active" type="button">INSTALLER</button><button type="button" data-opencode-refresh>STATUS</button>';
  body.innerHTML='<section class="opencode-panel"><header><div><small>VMDESKTOPREIC · TERMINAL SHELL</small><h2>OpenCode Runtime</h2><p>Pasang OpenCode CLI pada mesin Linux/macOS yang menjalankan Shell Agent lokal.</p></div><span class="opencode-mark">⌘</span></header><div class="opencode-command"><label>PERINTAH RESMI</label><code>curl -fsSL https://opencode.ai/v2/install | bash</code></div><div class="opencode-status" id="opencodeStatus" role="status" aria-live="polite">Memeriksa Shell Agent…</div><div class="opencode-actions"><button id="opencodeCheck" type="button">PERIKSA KONEKSI</button><button id="opencodeInstall" type="button">INSTALL OPENCODE</button></div><label class="opencode-log-label" for="opencodeLog">OUTPUT TERMINAL</label><pre id="opencodeLog">Menghubungkan ke 127.0.0.1:43821…</pre><p class="opencode-note">Keamanan: VMDESKTOPREIC hanya memanggil endpoint instalasi tetap. Tidak ada kolom untuk menjalankan perintah arbitrer. Shell Agent hanya mendengarkan pada localhost dan memeriksa origin situs.</p><a class="opencode-doc" href="./opencode-shell-agent.mjs" target="_blank" rel="noopener">LIHAT SHELL AGENT</a></section>';
  if(statusBar)statusBar.textContent='OpenCode · LOCAL SHELL BRIDGE';
  backdrop.hidden=false;backdrop.setAttribute('aria-hidden','false');
  $('#opencodeCheck').addEventListener('click',check);$('#opencodeInstall').addEventListener('click',install);$('[data-opencode-refresh]',tabs||document)?.addEventListener('click',check);
  check();
 }
 const observer=new MutationObserver(render);observer.observe(document.documentElement,{childList:true,subtree:true});render();
 window.VMOpenCodeInstaller=Object.freeze({open,check});
})();