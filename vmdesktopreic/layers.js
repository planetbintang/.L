/* VMDESKTOPREIC — editor lapisan REIC yang dapat diisi dan disimpan. */
(()=> {
  'use strict';
  const STORE='planetbintang.vmdesktopreic.layers.v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(_){return {}}};
  const write=data=>{try{localStorage.setItem(STORE,JSON.stringify(data));return true}catch(_){return false}};
  const regionDefaults=()=>({sidebar:'SIDEBAR',header:'HEADER',body:'BODY',center:'CENTER',dropdown:'DROPDOWN'});
  const defaults=(title,main)=>({name:title||'MENU BARU',mainMenu:main||'MENU UTAMA',shape:'panel',regions:regionDefaults(),blocks:[{id:'b1',type:'heading',region:'body',label:'JUDUL KONTEN',value:'Ruang kerja REIC'},{id:'b2',type:'text',region:'body',label:'DESKRIPSI',value:'Klik UBAH untuk mengisi konten menu ini.'}]});
  const css=`
  .reic-layer-editor{margin:0 0 18px;border:1px solid #426783;background:linear-gradient(145deg,#10263a,#081522);color:#eaf5ff;box-shadow:0 14px 34px #0004}
  .reic-le-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #35556d;background:linear-gradient(100deg,#1a3c56,#0b1c2b)}
  .reic-le-head strong{font-size:11px;letter-spacing:.13em}.reic-le-head small{display:block;margin-top:4px;color:#91b5ce;font-size:9px}
  .reic-le-actions{display:flex;gap:6px;flex-wrap:wrap}.reic-le-actions button,.reic-le-btn{padding:8px 11px;border:1px solid #50758d;background:#102b40;color:#c9f3ff;font-size:9px;letter-spacing:.06em;cursor:pointer}
  .reic-le-actions button:hover,.reic-le-btn:hover{border-color:#83e1ff;background:#1b4965}
  .reic-le-grid{display:grid;grid-template-columns:190px minmax(0,1fr);min-height:300px}
  .reic-le-rail{padding:12px;border-right:1px solid #29445d;background:#091827}
  .reic-le-label{display:block;margin:0 0 6px;color:#8fb0c8;font-size:8px;letter-spacing:.13em}
  .reic-le-rail input,.reic-le-rail select,.reic-le-edit input,.reic-le-edit textarea,.reic-le-edit select{box-sizing:border-box;width:100%;padding:9px;border:1px solid #35556d;background:#071522;color:#edf7ff;outline:none;font:inherit;font-size:11px}
  .reic-le-rail input:focus,.reic-le-rail select:focus,.reic-le-edit input:focus,.reic-le-edit textarea:focus{border-color:#83e1ff}
  .reic-le-field{margin-bottom:13px}.reic-le-layer-list{display:grid;gap:5px;margin-top:8px}
  .reic-le-layer-list button{padding:9px;text-align:left;border:1px solid #29445d;background:#102338;color:#c5d9e8;font-size:9px;cursor:pointer}
  .reic-le-layer-list button.active{border-color:#83e1ff;background:#19415b;color:#fff}
  .reic-le-stage{min-width:0;padding:14px}
  .reic-le-stagebar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}
  .reic-le-stagebar b{font-size:10px;letter-spacing:.1em}.reic-le-stagebar span{font-size:8px;color:#8fb0c8}
  .reic-le-canvas{min-height:180px;padding:14px;border:1px dashed #527b96;background:linear-gradient(145deg,#142d43,#091725)}
  .reic-le-canvas[data-shape="cards"]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .reic-le-canvas[data-shape="grid"]{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;background-image:linear-gradient(#35556d33 1px,transparent 1px),linear-gradient(90deg,#35556d33 1px,transparent 1px);background-size:20px 20px}
  .reic-le-canvas[data-shape="split"]{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .reic-le-canvas[data-shape="tabs"]{border-radius:12px}
  .reic-le-canvas[data-shape="sidebar"]{border-left:5px solid #83e1ff}\n  .reic-le-regions{display:grid;grid-template-columns:minmax(90px,.7fr) minmax(0,2fr);grid-template-areas:"side head" "side body" "side center" "side drop";gap:7px;margin-bottom:10px}.reic-le-region{padding:8px;border:1px solid #527b96;background:#0a1b2b;min-width:0}.reic-le-region b{display:block;color:#83e1ff;font-size:8px;letter-spacing:.12em}.reic-le-region small{color:#91b5ce;font-size:8px}.reic-le-region[data-region="sidebar"]{grid-area:side}.reic-le-region[data-region="header"]{grid-area:head}.reic-le-region[data-region="body"]{grid-area:body}.reic-le-region[data-region="center"]{grid-area:center}.reic-le-region[data-region="dropdown"]{grid-area:drop}.reic-le-edit select{box-sizing:border-box;width:100%;padding:9px;background:#071522;color:#edf7ff;border:1px solid #35556d}
  .reic-le-block{position:relative;min-width:0;padding:12px;margin-bottom:8px;border:1px solid #426783;background:linear-gradient(145deg,#18354d,#0b1b2b)}
  .reic-le-block:last-child{margin-bottom:0}.reic-le-block h4{margin:0 0 7px;font-size:11px;color:#dff8ff}
  .reic-le-block p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;color:#aac1d4;font-size:10px;line-height:1.55}
  .reic-le-block input{width:100%;box-sizing:border-box;padding:8px;background:#071522;border:1px solid #426783;color:#fff}
  .reic-le-block img{max-width:100%;height:72px;object-fit:cover;opacity:.6}
  .reic-le-block-actions{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}
  .reic-le-block-actions button{padding:5px 7px;border:1px solid #35556d;background:#0a1b2b;color:#aeeaff;font-size:8px;cursor:pointer}
  .reic-le-edit{display:grid;gap:8px;margin-top:12px;padding:12px;border:1px solid #35556d;background:#0a1b2b}
  .reic-le-edit textarea{min-height:72px;resize:vertical}.reic-le-add{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
  .reic-le-status{padding:9px 13px;border-top:1px solid #29445d;color:#91b5ce;font-size:9px}
  @media(max-width:620px){.reic-le-grid{grid-template-columns:1fr}.reic-le-rail{border-right:0;border-bottom:1px solid #29445d}.reic-le-canvas[data-shape="grid"]{grid-template-columns:repeat(2,minmax(0,1fr))}.reic-le-head{align-items:flex-start;flex-direction:column}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  function mount(){
    const body=document.querySelector('#modalBody');if(!body||body.querySelector('.reic-layer-editor'))return;
    const title=document.querySelector('#modalTitle')?.textContent?.trim()||'MENU REIC';
    const activeCore=document.querySelector('.core-item.active');
    const mainName=(activeCore?.textContent||'MENU UTAMA').trim().replace(/\\s+/g,' ');
    const key=(mainName+'--'+title).toLocaleLowerCase('id').replace(/[^a-z0-9]+/g,'-');
    const data=read();const model=data[key]||defaults(title,mainName);if(!model.blocks)model.blocks=[];
    model.mainMenu=model.mainMenu||mainName;model.regions={...regionDefaults(),...(model.regions||{})};model.blocks.forEach(b=>{if(!b.region)b.region='body';});
    const root=document.createElement('section');root.className='reic-layer-editor';root.dataset.key=key;
    root.innerHTML=`
      <div class="reic-le-head"><div><strong>▧ EDITOR LAPISAN REIC</strong><small>BENTUK MENU · NAMA · BLOK KONTEN · PROPERTI · PENYIMPANAN</small></div><div class="reic-le-actions"><button type="button" data-action="save">✓ SIMPAN LAPISAN</button><button type="button" data-action="reset">↺ ATUR ULANG</button></div></div>
      <div class="reic-le-grid">
        <aside class="reic-le-rail">
          <div class="reic-le-field"><label class="reic-le-label">MENU UTAMA</label><input data-field="mainMenu" maxlength="80"></div><div class="reic-le-field"><label class="reic-le-label">NAMA MENU / SUBMENU</label><input data-field="name" maxlength="80"></div><label class="reic-le-label">NAMA BAGIAN MODAL</label><div class="reic-le-field"><label class="reic-le-label">SIDEBAR</label><input data-region-name="sidebar" maxlength="60"></div><div class="reic-le-field"><label class="reic-le-label">HEADER</label><input data-region-name="header" maxlength="60"></div><div class="reic-le-field"><label class="reic-le-label">BODY</label><input data-region-name="body" maxlength="60"></div><div class="reic-le-field"><label class="reic-le-label">CENTER</label><input data-region-name="center" maxlength="60"></div><div class="reic-le-field"><label class="reic-le-label">DROPDOWN</label><input data-region-name="dropdown" maxlength="60"></div>
          <div class="reic-le-field"><label class="reic-le-label">BENTUK LAYOUT</label><select data-field="shape"><option value="panel">PANEL BERLAPIS</option><option value="cards">KARTU MODULAR</option><option value="grid">KISI KOMPONEN</option><option value="split">DUA KOLOM</option><option value="tabs">TAB KONTEN</option><option value="sidebar">SIDEBAR + KONTEN</option></select></div>
          <label class="reic-le-label">STRUKTUR LAPISAN</label><div class="reic-le-layer-list" data-layer-list></div>
        </aside>
        <div class="reic-le-stage"><div class="reic-le-stagebar"><b>PRATINJAU BLOK KONTEN</b><span data-count></span></div><div class="reic-le-canvas" data-canvas></div>
          <div class="reic-le-edit" data-editor><b style="font-size:10px">PROPERTI BLOK TERPILIH</b><label class="reic-le-label">JUDUL / LABEL</label><input data-edit="label" placeholder="Nama blok"><label class="reic-le-label">BAGIAN / LAPISAN</label><select data-edit="region"><option value="sidebar">SIDEBAR</option><option value="header">HEADER</option><option value="body">BODY</option><option value="center">CENTER</option><option value="dropdown">DROPDOWN</option></select><label class="reic-le-label">ISI KONTEN</label><textarea data-edit="value" placeholder="Tulis atau isi konten di sini…"></textarea><button class="reic-le-btn" type="button" data-action="apply">TERAPKAN PERUBAHAN BLOK</button></div>
          <div class="reic-le-add"><button class="reic-le-btn" type="button" data-add="heading">＋ JUDUL</button><button class="reic-le-btn" type="button" data-add="text">＋ TEKS</button><button class="reic-le-btn" type="button" data-add="input">＋ FORMULIR</button><button class="reic-le-btn" type="button" data-add="table">＋ TABEL</button><button class="reic-le-btn" type="button" data-add="image">＋ AREA GAMBAR</button><button class="reic-le-btn" type="button" data-add="space">＋ AREA KOSONG</button></div>
        </div>
      </div><div class="reic-le-status" data-status>Siap mengedit · perubahan disimpan pada perangkat ini.</div>`;
    body.prepend(root);
    const $=s=>root.querySelector(s);let selected=model.blocks[0]?.id||null;
    $('[data-field="name"]').value=model.name;$('[data-field="mainMenu"]').value=model.mainMenu;$('[data-field="shape"]').value=model.shape||'panel';root.querySelectorAll('[data-region-name]').forEach(el=>el.value=model.regions[el.dataset.regionName]||el.dataset.regionName.toUpperCase());
    const blockName=b=>({heading:'JUDUL',text:'TEKS',input:'FORMULIR',table:'TABEL',image:'GAMBAR',space:'AREA KOSONG'}[b.type]||'BLOK');
    function persist(){data[key]=model;const ok=write(data);$('[data-status]').textContent=ok?'Tersimpan di penyimpanan lokal perangkat · '+new Date().toLocaleTimeString('id-ID'):'Penyimpanan lokal tidak tersedia.';}
    function render(){
      const canvas=$('[data-canvas]');canvas.dataset.shape=model.shape||'panel';
      canvas.innerHTML=model.blocks.map(b=>{
        const body=b.type==='input'?'<input placeholder="'+esc(b.value||'Isi formulir…')+'" disabled>':b.type==='image'?'<div style="padding:14px;border:1px dashed #83e1ff;color:#83e1ff;font-size:9px">▧ AREA GAMBAR · '+esc(b.value||'Tambahkan sumber gambar')+'</div>':b.type==='table'?'<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px"><span>KOLOM 01</span><span>KOLOM 02</span><span>Isi data</span><span>Isi data</span></div>':b.type==='space'?'<div style="min-height:48px;border:1px dashed #527b96"></div>':b.type==='heading'?'<h4>'+esc(b.value||'Judul baru')+'</h4>':'<p>'+esc(b.value||'Konten baru')+'</p>';
        return '<article class="reic-le-block" data-block="'+esc(b.id)+'">'+(b.type!=='heading'?'<h4>'+esc(b.label||blockName(b))+'</h4>':'')+body+'<div class="reic-le-block-actions"><button type="button" data-select="'+esc(b.id)+'">UBAH</button><button type="button" data-move="-1" data-id="'+esc(b.id)+'">↑</button><button type="button" data-move="1" data-id="'+esc(b.id)+'">↓</button><button type="button" data-delete="'+esc(b.id)+'">HAPUS</button></div></article>';
      }).join('')||'<div style="padding:30px;text-align:center;color:#91a8c3;font-size:10px">AREA KONTEN KOSONG · TAMBAHKAN BLOK DI BAWAH</div>';
      $('[data-layer-list]').innerHTML=model.blocks.map((b,i)=>'<button type="button" class="'+(b.id===selected?'active':'')+'" data-select="'+esc(b.id)+'">'+String(i+1).padStart(2,'0')+' · '+blockName(b)+' — '+esc(b.label||b.value||'Baru').slice(0,22)+'</button>').join('')||'<small style="color:#91a8c3">Belum ada lapisan konten</small>';
      $('[data-count]').textContent=model.blocks.length+' BLOK AKTIF';
      const b=model.blocks.find(x=>x.id===selected);$('[data-edit="label"]').value=b?.label||'';$('[data-edit="value"]').value=b?.value||'';$('[data-edit="region"]').value=b?.region||'body';$('[data-edit="region"]').value=b?.region||'body';
    }
    root.addEventListener('click',e=>{
      const add=e.target.closest('[data-add]');if(add){const type=add.dataset.add;const b={id:'b'+Date.now().toString(36),type,region:'body',label:blockName({type})+' BARU',value:type==='heading'?'Judul baru':type==='text'?'Isi konten baru':''};model.blocks.push(b);selected=b.id;render();return;}
      const pick=e.target.closest('[data-select]');if(pick){selected=pick.dataset.select;render();return;}
      const del=e.target.closest('[data-delete]');if(del){model.blocks=model.blocks.filter(b=>b.id!==del.dataset.delete);selected=model.blocks[0]?.id||null;render();persist();return;}
      const move=e.target.closest('[data-move]');if(move){const i=model.blocks.findIndex(b=>b.id===move.dataset.id),j=i+Number(move.dataset.move);if(i>=0&&j>=0&&j<model.blocks.length){[model.blocks[i],model.blocks[j]]=[model.blocks[j],model.blocks[i]];render();persist();}return;}
      const action=e.target.closest('[data-action]')?.dataset.action;if(action==='apply'){const b=model.blocks.find(x=>x.id===selected);if(b){b.label=$('[data-edit="label"]').value;b.value=$('[data-edit="value"]').value;b.region=$('[data-edit="region"]').value;render();persist();}}else if(action==='save'){model.name=$('[data-field="name"]').value;model.mainMenu=$('[data-field="mainMenu"]').value;model.shape=$('[data-field="shape"]').value;persist();}else if(action==='reset'){if(confirm('Atur ulang lapisan menu ini?')){delete data[key];write(data);root.remove();mount();}}
    });
    $('[data-field="name"]').addEventListener('change',()=>{model.name=$('[data-field="name"]').value;persist();});
    $('[data-field="mainMenu"]').value=model.mainMenu;
    $('[data-field="mainMenu"]').addEventListener('change',()=>{model.mainMenu=$('[data-field="mainMenu"]').value;persist();});
    root.querySelectorAll('[data-region-name]').forEach(el=>{el.value=model.regions[el.dataset.regionName];el.addEventListener('change',()=>{model.regions[el.dataset.regionName]=el.value;persist();});});$('[data-field="mainMenu"]').addEventListener('change',()=>{model.mainMenu=$('[data-field="mainMenu"]').value;persist();});root.querySelectorAll('[data-region-name]').forEach(el=>el.addEventListener('change',()=>{model.regions[el.dataset.regionName]=el.value||el.dataset.regionName.toUpperCase();persist();}));
    $('[data-field="shape"]').addEventListener('change',()=>{model.shape=$('[data-field="shape"]').value;render();persist();});
    render();
  }
  const observer=new MutationObserver(()=>{if(!document.querySelector('#modalBackdrop[hidden]'))mount();});
  const start=()=>{const body=document.querySelector('#modalBody');if(body)observer.observe(body,{childList:true});mount();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('click',e=>{if(e.target.closest('#modalClose,#slideClose'))setTimeout(()=>{},0);});
})();