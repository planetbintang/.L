/* VMDESKTOPREIC BIOS AUTH — browser-local development registry.
 * Passwords are salted and hashed; raw passwords are never persisted.
 * Production authentication requires a trusted server-side identity/database service.
 */
(()=>{'use strict';
 const USERS_KEY='pb-vmdesktopreic-bios-users-v1';
 const AUDIT_KEY='pb-vmdesktopreic-bios-audit-v1';
 const SESSION_KEY='pb-vmdesktopreic-bios-session-v1';
 const $=(s,r=document)=>r.querySelector(s);
 const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback;}catch{return fallback;}};
 const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
 const users=()=>{const value=read(USERS_KEY,[]);return Array.isArray(value)?value:[];};
 const serialValue=value=>String(value||'').trim().toUpperCase().replace(/\\s+/g,'');
 const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const randomHex=bytes=>{const data=crypto.getRandomValues(new Uint8Array(bytes));return [...data].map(x=>x.toString(16).padStart(2,'0')).join('');};
 const hash=async(salt,password)=>{if(!crypto?.subtle)throw Error('Web Crypto tidak tersedia. Buka desktop melalui HTTPS.');const data=new TextEncoder().encode(salt+':'+password);const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');};
 const audit=(event,user)=>{const rows=read(AUDIT_KEY,[]);rows.unshift({event,serialNumber:user?.serialNumber||'',userId:user?.id||'',at:new Date().toISOString()});write(AUDIT_KEY,rows.slice(0,200));};
 let overlay=null,mode='login';
 function activeUser(){try{const session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');if(!session)return null;return users().find(u=>u.id===session.userId&&!u.disabled)||null;}catch{return null;}}
 function setMessage(message,isError=false){const out=$('[data-bios-message]',overlay);if(out){out.textContent=message;out.dataset.state=isError?'error':'ok';}}
 function setMode(next){mode=next;overlay.dataset.mode=next;$$('[data-bios-view]',overlay).forEach(el=>el.hidden=el.dataset.biosView!==next);$$('[data-bios-tab]',overlay).forEach(el=>el.classList.toggle('active',el.dataset.biosTab===next));setMessage(next==='register'?'Daftarkan identitas perangkat dan buat kredensial BIOS.':'Masukkan Serial Number dan kata sandi BIOS.');}
 const $$=(s,r=document)=>[...r.querySelectorAll(s)];
 function unlock(user){sessionStorage.setItem(SESSION_KEY,JSON.stringify({userId:user.id,authenticatedAt:new Date().toISOString()}));audit('LOGIN_SUCCESS',user);overlay.hidden=true;document.documentElement.classList.remove('pb-bios-locked');document.dispatchEvent(new CustomEvent('pb:bios-authenticated',{detail:{serialNumber:user.serialNumber}}));}
 function lock(){sessionStorage.removeItem(SESSION_KEY);overlay.hidden=false;document.documentElement.classList.add('pb-bios-locked');setMode('login');}
 function mount(){
  if(overlay)return;
  overlay=document.createElement('section');overlay.id='pbBiosAuth';overlay.className='pb-bios-auth';overlay.setAttribute('aria-label','BIOS Authentication');
  overlay.innerHTML='<div class="pb-bios-card"><header class="pb-bios-brand"><span class="pb-bios-chip">PB</span><div><b>PLANETBINTANG · BIOS</b><small>VMDESKTOPREIC PRE-BOOT AUTHENTICATION</small></div><span class="pb-bios-version">BIOS 1.0</span></header><div class="pb-bios-intro"><span class="pb-bios-eyebrow">SYSTEM STARTUP · SECURITY CHECK</span><h1>BIOS Authentication</h1><p>Verifikasi identitas perangkat sebelum OS Desktop REIC dijalankan.</p></div><nav class="pb-bios-tabs"><button type="button" data-bios-tab="login">LOGIN BIOS</button><button type="button" data-bios-tab="register">REGISTER DEVICE</button></nav><form data-bios-view="login" autocomplete="on"><label>Serial Number<input name="serial" required maxlength="32" autocomplete="username" placeholder="Masukkan SERIAL NUMBER"></label><label>Kata sandi BIOS<input name="password" type="password" required minlength="8" autocomplete="current-password" placeholder="Kata sandi perangkat"></label><button class="pb-bios-primary" type="submit">VERIFIKASI & BOOT OS <span>→</span></button></form><form data-bios-view="register" autocomplete="off" hidden><label>Nama pengguna / perangkat<input name="displayName" required maxlength="60" placeholder="Nama profil perangkat"></label><label>Serial Number<input name="serial" required minlength="8" maxlength="32" pattern="[A-Za-z0-9-]{8,32}" placeholder="Contoh: PB-REIC-000001"></label><label>Buat kata sandi BIOS<input name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Minimal 8 karakter"></label><label>Konfirmasi kata sandi<input name="confirm" type="password" required minlength="8" autocomplete="new-password" placeholder="Ulangi kata sandi"></label><button class="pb-bios-primary" type="submit">DAFTARKAN PERANGKAT <span>＋</span></button></form><div class="pb-bios-message" data-bios-message role="status" aria-live="polite"></div><footer class="pb-bios-foot"><span>BIOS REGISTRY · FILEMANAJER / bios</span><span>LOCAL DEVELOPMENT STORAGE</span></footer><p class="pb-bios-disclaimer">Mode pengembangan: data tersimpan pada browser/perangkat ini, bukan database cloud. Jangan gunakan sebagai pengamanan produksi atau untuk menyimpan data rahasia.</p></div>';
  document.body.append(overlay);
  $$('[data-bios-tab]',overlay).forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.biosTab)));
  $('[data-bios-view="register"]',overlay).addEventListener('submit',async e=>{
   e.preventDefault();const form=e.currentTarget,displayName=form.elements.displayName.value.trim(),serialNumber=serialValue(form.elements.serial.value),password=form.elements.password.value,confirm=form.elements.confirm.value;
   if(!/^[A-Z0-9-]{8,32}$/.test(serialNumber)){setMessage('Serial Number harus 8–32 karakter huruf, angka, atau tanda hubung.',true);return;}
   if(password.length<8){setMessage('Kata sandi minimal 8 karakter.',true);return;}
   if(password!==confirm){setMessage('Konfirmasi kata sandi tidak cocok.',true);return;}
   if(users().some(u=>u.serialNumber===serialNumber)){setMessage('Serial Number sudah terdaftar. Gunakan nomor lain atau masuk.',true);return;}
   const button=form.querySelector('button[type="submit"]');button.disabled=true;
   try{const salt=randomHex(16),user={id:'bios-'+randomHex(12),displayName,serialNumber,salt,passwordHash:await hash(salt,password),createdAt:new Date().toISOString(),disabled:false};const all=users();all.push(user);write(USERS_KEY,all);audit('REGISTER',user);form.reset();unlock(user);}catch(error){setMessage('Registrasi gagal: '+error.message,true);}finally{button.disabled=false;}
  });
  $('[data-bios-view="login"]',overlay).addEventListener('submit',async e=>{
   e.preventDefault();const form=e.currentTarget,serialNumber=serialValue(form.elements.serial.value),password=form.elements.password.value;const user=users().find(u=>u.serialNumber===serialNumber&&!u.disabled);
   if(!user){setMessage('Serial Number tidak ditemukan atau perangkat dinonaktifkan.',true);return;}
   const button=form.querySelector('button[type="submit"]');button.disabled=true;
   try{const candidate=await hash(user.salt,password);if(candidate!==user.passwordHash){audit('LOGIN_FAILED',user);setMessage('Kredensial BIOS tidak valid.',true);return;}form.reset();unlock(user);}catch(error){setMessage('Verifikasi gagal: '+error.message,true);}finally{button.disabled=false;}
  });
  setMode(users().length?'login':'register');
 }
 function boot(){mount();const user=activeUser();if(user){overlay.hidden=true;document.documentElement.classList.remove('pb-bios-locked');}else lock();}
 function renderFileManager(container,status){
  mount();container.replaceChildren();
  const panel=document.createElement('section');panel.className='pb-bios-registry';
  const heading=document.createElement('div');heading.className='pb-bios-registry-head';const title=document.createElement('div');const h=document.createElement('h2');h.textContent='BIOS REGISTRY';const p=document.createElement('p');p.textContent='Registrasi perangkat dan kontrol akses OS Desktop REIC';title.append(h,p);const count=document.createElement('strong');count.textContent=users().length+' PERANGKAT';heading.append(title,count);
  const note=document.createElement('p');note.className='pb-bios-registry-note';note.textContent='Serial Number, status perangkat, dan riwayat autentikasi tersimpan pada browser ini. Kata sandi tidak ditampilkan. Penyimpanan ini bukan database cloud.';panel.append(heading,note);
  const current=activeUser();const actions=document.createElement('div');actions.className='pb-bios-registry-actions';const add=document.createElement('button');add.type='button';add.textContent='＋ REGISTER PERANGKAT';add.onclick=()=>{setMode('register');overlay.hidden=false;};const logout=document.createElement('button');logout.type='button';logout.textContent='KELUAR / LOCK BIOS';logout.onclick=lock;actions.append(add,logout);panel.append(actions);
  const list=document.createElement('div');list.className='pb-bios-registry-list';const all=users();
  if(!all.length){const empty=document.createElement('p');empty.textContent='Belum ada perangkat terdaftar.';list.append(empty);}
  all.forEach(user=>{const row=document.createElement('article');row.className='pb-bios-registry-row';const info=document.createElement('div');const name=document.createElement('b');name.textContent=user.displayName;const serial=document.createElement('code');serial.textContent=user.serialNumber;const meta=document.createElement('small');meta.textContent='Terdaftar '+new Date(user.createdAt).toLocaleString('id-ID')+' · '+(user.disabled?'DINONAKTIFKAN':'AKTIF');info.append(name,serial,meta);const controls=document.createElement('div');controls.className='pb-bios-registry-controls';const toggle=document.createElement('button');toggle.type='button';toggle.textContent=user.disabled?'AKTIFKAN':'NONAKTIFKAN';toggle.onclick=()=>{const rows=users(),target=rows.find(x=>x.id===user.id);if(!target)return;target.disabled=!target.disabled;write(USERS_KEY,rows);audit(target.disabled?'DEVICE_DISABLED':'DEVICE_ENABLED',target);if(target.id===current?.id&&target.disabled)lock();renderFileManager(container,status);};const remove=document.createElement('button');remove.type='button';remove.textContent='HAPUS';remove.onclick=()=>{if(!confirm('Hapus registrasi perangkat '+user.serialNumber+' dari browser ini?'))return;write(USERS_KEY,users().filter(x=>x.id!==user.id));audit('DEVICE_REMOVED',user);if(user.id===current?.id)lock();renderFileManager(container,status);};controls.append(toggle,remove);row.append(info,controls);list.append(row);});
  panel.append(list);
  const history=document.createElement('details');history.className='pb-bios-audit';const summary=document.createElement('summary');summary.textContent='RIWAYAT AUTENTIKASI';history.append(summary);read(AUDIT_KEY,[]).slice(0,30).forEach(entry=>{const line=document.createElement('p');line.textContent=entry.event+' · '+(entry.serialNumber||'—')+' · '+new Date(entry.at).toLocaleString('id-ID');history.append(line);});panel.append(history);container.append(panel);if(status)status.textContent=all.length+' perangkat BIOS · registry browser-local';
 }
 window.PB_BIOS_AUTH=Object.freeze({boot,lock,renderFileManager,get currentUser(){return activeUser();},get status(){return activeUser()?'authenticated':'locked';}});
 mount();
})();