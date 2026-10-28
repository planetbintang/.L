(()=>{'use strict';
const q=s=>document.querySelector(s),list=q('#list'),search=q('#search'),view=q('#viewer'),source=q('#source'),back=q('#back'),count=q('#count');
let entries=[];
function el(t,c,v){const n=document.createElement(t);if(c)n.className=c;if(v!==undefined)n.textContent=v;return n}
async function openFile(file){
 try{
  const r=await fetch('./'+encodeURIComponent(file));if(!r.ok)throw Error('HTTP '+r.status);
  const text=await r.text(),stem=file.slice(0,-5);
  source.textContent=text;q('#viewTitle').textContent=file;view.classList.remove('hidden');list.parentElement.classList.add('hidden');
  history.replaceState(null,'','#'+encodeURIComponent(file));
  const style=q('#componentStyle'),script=q('#componentScript');
  style.href='./'+encodeURIComponent(stem+'.css');
  q('#componentWorkspace').replaceChildren();
  const form=el('form','reic-component'),label=el('label','','Input komponen'),input=el('textarea');
  input.name='input';input.rows=4;input.placeholder='Masukkan teks atau data untuk diproses';input.setAttribute('aria-label','Input komponen');
  const button=el('button','','Proses input');button.type='submit';
  const output=el('pre','reic-component-state','Keluaran runtime siap.');
  output.setAttribute('aria-live','polite');form.append(label,input,button,output);q('#componentWorkspace').append(form);
  q('#runtimeOutput').textContent='Siap. Input diproses lokal kecuali backend API dikonfigurasi.';
  script.onload=()=>{
   const api=window.OSMediaVMComponents&&window.OSMediaVMComponents[stem];
   if(api&&typeof api.mount==='function')api.mount(form);
  };
  script.onerror=()=>{q('#runtimeOutput').textContent='JavaScript pasangan gagal dimuat: '+stem+'.js'};
  script.src='./'+encodeURIComponent(stem+'.js')+'?v='+encodeURIComponent((entries.find(x=>x.file===file)||{}).id||stem);
  form.addEventListener('submit',async e=>{
   e.preventDefault();button.disabled=true;output.textContent='Memproses…';
   const payload={component:stem,input:input.value,submittedAt:new Date().toISOString()};
   const config=window.OSMediaVM_CONFIG||{};
   try{
    if(config.apiBaseUrl){
     const base=String(config.apiBaseUrl).replace(/\/+$/,'');
     const response=await fetch(base+'/components/process',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json',...(config.headers||{})},body:JSON.stringify(payload)});
     const body=await response.text();if(!response.ok)throw Error('Backend HTTP '+response.status);
     let data;try{data=body?JSON.parse(body):null}catch{data=body}
     output.textContent=typeof data==='string'?data:JSON.stringify(data,null,2);
     q('#runtimeOutput').textContent='Selesai melalui backend terkonfigurasi.';
    }else{
     output.textContent='Input diterima (mode statis):\n'+input.value;
     q('#runtimeOutput').textContent='Mode lokal aktif. Untuk backend nyata, set window.OSMediaVM_CONFIG.apiBaseUrl ke API HTTPS milik Anda.';
    }
   }catch(err){output.textContent='Gagal: '+err.message;q('#runtimeOutput').textContent='Backend gagal diakses. Periksa URL API, CORS, dan layanan backend.'}
   finally{button.disabled=false}
  });
 }catch(e){source.textContent='Gagal membuka berkas: '+e.message;view.classList.remove('hidden')}
}
function draw(){
 const s=search.value.toLocaleLowerCase('id'),found=entries.filter(x=>(x.file+' '+x.title+' '+x.source).toLocaleLowerCase('id').includes(s));
 list.replaceChildren(...found.map(x=>{const a=el('a','item');a.href='./'+encodeURIComponent(x.file);a.append(el('strong','',x.title),el('small','',x.source||'REIC'),el('code','',x.file));a.addEventListener('click',e=>{e.preventDefault();openFile(x.file)});return a}));
 count.textContent=found.length.toLocaleString('id')+' berkas REIC · '+entries.length.toLocaleString('id')+' total';
}
search.addEventListener('input',draw);
back.addEventListener('click',()=>{view.classList.add('hidden');list.parentElement.classList.remove('hidden');history.replaceState(null,'',location.pathname)});
fetch('./manifest.json').then(r=>{if(!r.ok)throw Error('manifest tidak tersedia');return r.json()}).then(d=>{entries=d;draw();const f=decodeURIComponent(location.hash.slice(1));if(f&&entries.some(x=>x.file===f))openFile(f)}).catch(e=>count.textContent='Gagal memuat katalog: '+e.message);
})();