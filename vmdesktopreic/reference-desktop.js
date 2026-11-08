/* REIC Reference Desktop · six category shortcuts, delayed single click and double-click modal launch. */
(()=>{'use strict';
 const core=document.querySelector('#vmDesktop .vm-core-menu');
 const panel=document.getElementById('slidePanel');
 const title=document.getElementById('slideTitle');
 const icon=document.getElementById('slideIcon');
 const items=document.getElementById('slideItems');
 if(!core||!panel||!items)return;
 const definitions=[
  {id:'settings',label:'PENGATURAN',icon:'⚙',group:'pengaturan',items:['Tampilan Desktop','Personalisasi','Jaringan & koneksi','Keamanan & privasi','Akun dan akses','Perangkat','Notifikasi','Penyimpanan','Bahasa & wilayah','Daya dan sistem']},
  {id:'studio',label:'STUDIO & AI GLOBAL AGENSI',icon:'✿',group:'studio-media',items:['Studio Kreatif','AI Global Agent','Manajemen Agen','Alur Otomatisasi','Model & Integrasi','Asset Library','Proyek Kreatif','Publikasi','Riwayat Pekerjaan']},
  {id:'documents',label:'PEMBUAT DOKUMEN',icon:'▤',group:'aplikasi',items:['Dokumen Baru','Editor Dokumen','Templat Dokumen','PDF & Ekspor','Dokumen Tersimpan','Riwayat Versi','Impor Dokumen','Berbagi Dokumen']},
  {id:'search',label:'PENCARIAN UTAMA',icon:'🌐',group:'file-data',items:['Pencarian Global','Pencarian Web','Pencarian Repositori','Pencarian File','Filter & Indeks','Riwayat Pencarian','Simpan Pencarian']},
  {id:'files',label:'FOLDER FILE MANAJER',icon:'📁',group:'file-data',items:['Beranda File','Dokumen','Gambar','Video','Musik','Unduhan','Cloud','Sistem','Tempat Sampah','Folder Bersama']},
  {id:'apps',label:'APLIKASI SISTEM',icon:'▦',group:'aplikasi',items:['Semua Aplikasi','Aplikasi Terpasang','Pusat Paket','Pembaruan Aplikasi','Kategori Aplikasi','Pintasan Desktop','Unity Studio','Package Manager']}
 ];
 core.setAttribute('aria-label','Enam menu utama VMDESKTOPREIC');
 core.replaceChildren();
 for(const menu of definitions){
  const button=document.createElement('button');button.type='button';button.className='core-item ref-menu-button';button.dataset.refMenu=menu.id;button.title=menu.label;button.setAttribute('aria-label',menu.label);button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
  const glyph=document.createElement('span');glyph.textContent=menu.icon;
  const text=document.createElement('b');text.textContent=menu.label;
  button.append(glyph,text);core.append(button);
 }
 const byId=id=>definitions.find(x=>x.id===id);
 function closeSlide(){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');panel.dataset.activeMenu='';core.querySelectorAll('.ref-menu-button').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-expanded','false');});}
 function showSlide(menu){if(!menu)return;title.textContent=menu.label;icon.textContent=menu.icon;items.replaceChildren();for(const [index,label] of menu.items.entries()){const row=document.createElement('button');row.type='button';row.className='ref-slide-item';row.dataset.slideMenu=menu.id;row.dataset.slideIndex=String(index);const glyph=document.createElement('span');glyph.textContent=['✦','▣','◈','⌕','▱','↗','◉','▤'][index%8];const text=document.createElement('b');text.textContent=label;const arrow=document.createElement('i');arrow.textContent='›';row.append(glyph,text,arrow);items.append(row);}panel.classList.add('open');panel.hidden=false;panel.setAttribute('aria-hidden','false');panel.dataset.activeMenu=menu.id;core.querySelectorAll('.ref-menu-button').forEach(b=>{const active=b.dataset.refMenu===menu.id;b.classList.toggle('active',active);b.setAttribute('aria-expanded',String(active));});}
 function openModal(menu,label){if(!menu)return;closeSlide();const packageManager=window.REIC_PACKAGE_MANAGER;const catalog=window.VMDESKTOPREIC_CATALOG;const menus=window.VMDESKTOPREIC_MENUS;
  if(menu.id==='apps'&&packageManager){packageManager.open('packages');return;}
  if(menu.id==='files'&&catalog?.openByTitle){if(catalog.openByTitle('FILE MANAGER'))return;}
  if(catalog){if(label&&catalog.openByTitle?.(label))return;if(catalog.openGroup?.(menu.group))return;}
  if(menus?.open){menus.open(menu.group);return;}
  const fallback=document.querySelector('.vm-core-menu .pb-main-menu[data-pb-menu="'+menu.group+'"]');fallback?.click();
 }
 let clickTimer=0,lastTarget=null,ignoreNextDbl=0;
 document.addEventListener('click',event=>{
  const button=event.target.closest('#vmDesktop .ref-menu-button');
  if(button){event.preventDefault();event.stopImmediatePropagation();const menu=byId(button.dataset.refMenu);if(event.detail>=2){clearTimeout(clickTimer);clickTimer=0;lastTarget=null;ignoreNextDbl=Date.now()+500;openModal(menu);return;}clearTimeout(clickTimer);lastTarget=button;clickTimer=window.setTimeout(()=>{clickTimer=0;lastTarget=null;if(panel.classList.contains('open')&&panel.dataset.activeMenu===menu.id)closeSlide();else showSlide(menu);},260);return;}
  const row=event.target.closest('#slideItems .ref-slide-item');if(row){event.preventDefault();event.stopImmediatePropagation();const menu=byId(row.dataset.slideMenu);const label=menu?.items[Number(row.dataset.slideIndex)]||'';openModal(menu,label);return;}
  if(event.target.closest('#slideClose')){event.preventDefault();event.stopImmediatePropagation();closeSlide();}
 },true);
 document.addEventListener('dblclick',event=>{const button=event.target.closest('#vmDesktop .ref-menu-button');if(!button)return;event.preventDefault();event.stopImmediatePropagation();if(Date.now()<ignoreNextDbl){ignoreNextDbl=0;return;}clearTimeout(clickTimer);clickTimer=0;lastTarget=null;openModal(byId(button.dataset.refMenu));},true);
 document.addEventListener('click',event=>{if(!panel.classList.contains('open'))return;if(!panel.contains(event.target)&&!core.contains(event.target))closeSlide();},false);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSlide();});
 const search=document.getElementById('centerSearch');if(search){search.setAttribute('aria-label','Cari aplikasi, menu, dan fitur REIC');search.placeholder='Cari aplikasi atau folder…';}
 const toolButtons=[...document.querySelectorAll('#vmDesktop .vm-header-tools button')];const topIcon=['📁','▧','▤','⚙','▣','⏻','▦','</>'];toolButtons.forEach((b,i)=>{b.textContent=topIcon[i]||b.textContent;b.setAttribute('aria-label',b.title||'Alat desktop');});
 const shell=document.querySelector('.vm-shell');if(shell)shell.dataset.referenceDesktop='six-menu';
 window.VMDESKTOPREIC_REFERENCE_UI=Object.freeze({version:'1.0.0',menuCount:definitions.length,openMenu:id=>{const menu=byId(id);if(menu)showSlide(menu);},openModal:id=>openModal(byId(id)),close:closeSlide});
})();
