/* VMDESKTOPREIC BIOS AUTH — REIC Table API client.
 * No browser-local identity store. The REIC database is authoritative.
 * Configure window.PB_REIC_API_BASE to the deployed Aireber origin when cross-hosted.
 */
(()=>{'use strict';
 const API_BASE=String(window.PB_REIC_API_BASE||document.querySelector('meta[name="reic-api-base"]')?.content||location.origin).replace(/\/$/,'');
 const SESSION_KEY='pb-reic-bios-client-state';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 let overlay=null,mode='login',currentDevice=null,canManage=false,apiReady=false;
 const api=async(path,options={})=>{
  const response=await fetch(API_BASE+'/api/bios'+path,{...options,credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw Error(data.error||('REIC BIOS API HTTP '+response.status));
  return data;
 };
 const post=(body)=>api('',{method:'POST',body:JSON.stringify(body)});
 function setMessage(message,isError=false){const out=$('[data-bios-message]',overlay);if(out){out.textContent=message;out.dataset.state=isError?'error':'ok';}}
 function setMode(next){mode=next;overlay.dataset.mode=next;$$('[data-bios-view]',overlay).forEach(el=>el.hidden=el.dataset.biosView!==next);$$('[data-bios-tab]',overlay).forEach(el=>el.classList.toggle('active',el.dataset.biosTab===next));setMessage(next==='register'?'Daftarkan perangkat ke database REIC BIOS Registry.':'Masukkan Serial Number dan kata sandi BIOS.');}
 function unlock(device){currentDevice=device;sessionStorage.setItem(SESSION_KEY,JSON.stringify({serialNumber:device.serialNumber,role:device.role}));overlay.hidden=true;document.documentElement.classList.remove('pb-bios-locked');document.dispatchEvent(new CustomEvent('pb:bios-authenticated',{detail:{serialNumber:device.serialNumber,role:device.role}}));}
 async function lock(){try{if(apiReady)await post({action:'logout'});}catch{}currentDevice=null;sessionStorage.removeItem(SESSION_KEY);overlay.hidden=false;document.documentElement.classList.add('pb-bios-locked');setMode('login');}
 function mount(){
  if(overlay)return;
  overlay=document.createElement('section');overlay.id='pbBiosAuth';overlay.className='pb-bios-auth';overlay.setAttribute('aria-label','BIOS Authentication');
  overlay.innerHTML='<div class="pb-bios-card"><header class="pb-bios-brand"><span class="pb-bios-chip">PB</span><div><b>PLANETBINTANG · BIOS</b><small>VMDESKTOPREIC PRE-BOOT AUTHENTICATION</small></div><span class="pb-bios-version">BIOS 1.0</span></header><div class="pb-bios-intro"><span class="pb-bios-eyebrow">SYSTEM STARTUP · SECURITY CHECK</span><h1>BIOS Authentication</h1><p>Verifikasi identitas perangkat melalui REIC Table sebelum OS Desktop REIC dijalankan.</p></div><nav class="pb-bios-tabs"><button type="button" data-bios-tab="login">LOGIN BIOS</button><button type="button" data-bios-tab="register">REGISTER DEVICE</button></nav><form data-bios-view="login" autocomplete="on"><label>Serial Number<input name="serial" required maxlength="32" autocomplete="username" placeholder="Masukkan SERIAL NUMBER"></label><label>Kata sandi BIOS<input name="password" type="password" required minlength="10" autocomplete="current-password" placeholder="Minimal 10 karakter"></label><button class="pb-bios-primary" type="submit">VERIFIKASI & BOOT OS <span>→</span></button></form><form data-bios-view="register" autocomplete="off" hidden><label>Nama pengguna / perangkat<input name="displayName" required maxlength="60" placeholder="Nama profil perangkat"></label><label>Serial Number<input name="serial" required minlength="8" maxlength="32" pattern="[A-Za-z0-9-]{8,32}" placeholder="Contoh: PB-REIC-000001"></label><label>Buat kata sandi BIOS<input name="password" type="password" required minlength="10" autocomplete="new-password" placeholder="Minimal 10 karakter"></label><label>Konfirmasi kata sandi<input name="confirm" type="password" required minlength="10" autocomplete="new-password" placeholder="Ulangi kata sandi"></label><button class="pb-bios-primary" type="submit">DAFTARKAN KE REIC TABLE <span>＋</span></button></form><div class="pb-bios-message" data-bios-message role="status" aria-live="polite"></div><footer class="pb-bios-foot"><span>BIOS REGISTRY · REIC TABLE / bios_devices</span><span>SERVER DATABASE</span></footer><p class="pb-bios-disclaimer">Autentikasi dikelola server. Hash kata sandi dan sesi tidak dikirim ke Filemanajer. API: '+API_BASE+'</p></div>';
  document.body.append(overlay);
  $$('[data-bios-tab]',overlay).forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.biosTab)));
  $('[data-bios-view="register"]',overlay).addEventListener('submit',async e=>{
   e.preventDefault();const form=e.currentTarget,displayName=form.elements.displayName.value.trim(),serialNumber=form.elements.serial.value.trim().toUpperCase().replace(/\s+/g,''),password=form.elements.password.value,confirm=form.elements.confirm.value;
   if(password.length<10){setMessage('Kata sandi minimal 10 karakter.',true);return;}if(password!==confirm){setMessage('Konfirmasi kata sandi tidak cocok.',true);return;}
   const button=form.querySelector('button[type="submit"]');button.disabled=true;
   try{const result=await post({action:'register',displayName,serialNumber,password});form.reset();unlock(result.device);}catch(error){setMessage(error.message,true);}finally{button.disabled=false;}
  });
  $('[data-bios-view="login"]',overlay).addEventListener('submit',async e=>{
   e.preventDefault();const form=e.currentTarget,serialNumber=form.elements.serial.value.trim().toUpperCase().replace(/\s+/g,''),password=form.elements.password.value,button=form.querySelector('button[type="submit"]');button.disabled=true;
   try{const result=await post({action:'login',serialNumber,password});form.reset();unlock(result.device);}catch(error){setMessage(error.message,true);}finally{button.disabled=false;}
  });
  setMode('login');
 }
 async function boot(){
  mount();overlay.hidden=false;document.documentElement.classList.add('pb-bios-locked');setMessage('Menghubungkan REIC BIOS Registry…');
  try{const health=await api('?action=health');if(health.storage!=='reic-table')throw Error('Backend bukan REIC Table.');apiReady=true;
   try{const result=await api('?action=me');unlock(result.device);}catch(error){if(/session|berakhir/i.test(error.message)||error.message.includes('401')){setMode('login');setMessage('Sesi tidak aktif. Login atau register perangkat.');}else{setMode('login');setMessage(error.message,true);}}
  }catch(error){apiReady=false;setMode('login');setMessage('REIC BIOS API belum terhubung. Atur PB_REIC_API_BASE ke alamat backend Aireber yang sudah deploy. '+error.message,true);}
 }
 async function renderFileManager(container,status){
  mount();container.replaceChildren();const panel=document.createElement('section');panel.className='pb-bios-registry';container.append(panel);
  const heading=document.createElement('div');heading.className='pb-bios-registry-head';const title=document.createElement('div');const h=document.createElement('h2');h.textContent='BIOS REGISTRY · REIC TABLE';const p=document.createElement('p');p.textContent='Database perangkat, autentikasi, sesi, dan audit BIOS';title.append(h,p);const count=document.createElement('strong');count.textContent='MEMUAT…';heading.append(title,count);panel.append(heading);
  const note=document.createElement('p');note.className='pb-bios-registry-note';note.textContent='Sumber data: tabel bios_devices, bios_sessions, dan bios_audit pada backend REIC. Kredensial rahasia tidak pernah ditampilkan.';panel.append(note);
  const actions=document.createElement('div');actions.className='pb-bios-registry-actions';const add=document.createElement('button');add.type='button';add.textContent='＋ REGISTER PERANGKAT';add.onclick=()=>{setMode('register');overlay.hidden=false;};const logout=document.createElement('button');logout.type='button';logout.textContent='KELUAR / LOCK BIOS';logout.onclick=lock;actions.append(add,logout);panel.append(actions);
  const list=document.createElement('div');list.className='pb-bios-registry-list';panel.append(list);
  const history=document.createElement('details');history.className='pb-bios-audit';const summary=document.createElement('summary');summary.textContent='RIWAYAT AUTENTIKASI';history.append(summary);panel.append(history);
  try{
   const result=await api('?action=devices');canManage=!!result.canManage;count.textContent=result.devices.length+' PERANGKAT · REIC TABLE';currentDevice=currentDevice||null;
   result.devices.forEach(device=>{const row=document.createElement('article');row.className='pb-bios-registry-row';const info=document.createElement('div');const name=document.createElement('b');name.textContent=device.displayName;const serial=document.createElement('code');serial.textContent=device.serialNumber;const meta=document.createElement('small');meta.textContent='ID '+device.id+' · '+device.role.toUpperCase()+' · '+device.status.toUpperCase()+' · LOGIN TERAKHIR '+(device.lastLoginAt?new Date(device.lastLoginAt).toLocaleString('id-ID'):'BELUM ADA');info.append(name,serial,meta);row.append(info);
    if(canManage){const controls=document.createElement('div');controls.className='pb-bios-registry-controls';const toggle=document.createElement('button');toggle.type='button';toggle.textContent=device.status==='disabled'?'AKTIFKAN':'NONAKTIFKAN';toggle.onclick=async()=>{try{await post({action:'set-device-status',id:device.id,status:device.status==='disabled'?'active':'disabled'});await renderFileManager(container,status);}catch(e){setMessage(e.message,true);}};const remove=document.createElement('button');remove.type='button';remove.textContent='HAPUS';remove.onclick=async()=>{if(!confirm('Hapus perangkat '+device.serialNumber+' dari REIC Table?'))return;try{await post({action:'delete-device',id:device.id});await renderFileManager(container,status);}catch(e){setMessage(e.message,true);}};controls.append(toggle,remove);row.append(controls);}
    list.append(row);
   });
   const logs=await api('?action=audit');logs.audit.forEach(entry=>{const line=document.createElement('p');line.textContent=entry.event+' · '+entry.serialNumber+' · '+new Date(entry.createdAt).toLocaleString('id-ID');history.append(line);});
   if(status)status.textContent=result.devices.length+' perangkat · sumber REIC Table'+(canManage?' · administrator':' · akses perangkat sendiri');
  }catch(error){count.textContent='API TIDAK TERSEDIA';const empty=document.createElement('p');empty.className='pb-bios-registry-note';empty.textContent=error.message;list.append(empty);if(status)status.textContent='BIOS Registry API belum terhubung';}
 }
 window.PB_BIOS_AUTH=Object.freeze({boot,lock,renderFileManager,get currentUser(){return currentDevice;},get status(){return currentDevice?'authenticated':'locked';},get apiBase(){return API_BASE;}});
 mount();
})();