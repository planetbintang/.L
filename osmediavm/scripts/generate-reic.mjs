#!/usr/bin/env node
/**
 * Pembuat katalog REIC OS MEDIA VM.
 * Menghasilkan 15.000 komponen × 3 berkas (.reic, .css, .js).
 * Jalankan: node osmediavm/scripts/generate-reic.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.REIC_OUTPUT || 'osmediavm/recordin/components';
const total = 15000;
const groups = [
['identitas-desain', ['Identitas merek dan logo utama','Sistem desain global','Palet warna premium','Tipografi profesional','Ikonografi terpadu','Tata letak adaptif','Tema terang dan gelap','Efek kaca dan transparansi','Animasi antarmuka halus','Sistem grid presisi','Komponen UI reusable','Sistem desain responsif','Standar aksesibilitas WCAG','Dukungan berbagai resolusi','Panduan konsistensi visual']],
['desktop-navigasi', ['Desktop utama interaktif','Bilah menu utama','Dock aplikasi','Taskbar','Peluncur aplikasi','Pencarian universal','Pusat notifikasi','Panel pengaturan cepat','Pengelola jendela','Sistem multiwindow','Desktop virtual','Pintasan keyboard','Menu konteks','Modal dialog standar','Navigasi menu REIC']],
['file-manager', ['File manager terpadu','Pohon direktori','Sistem folder bertingkat','Pratinjau berkas','Editor teks','Editor kode','Pengelola gambar','Pengelola audio dan video','Pencarian berkas','Filter dan pengurutan','Salin dan pindahkan berkas','Pengelola arsip','Recycle bin','Riwayat versi','Indeks berkas dan metadata']],
['server-cloud', ['Infrastruktur hosting','Server aplikasi','Server web','Reverse proxy','Load balancer','Content Delivery Network','Edge computing','Container runtime','Orkestrasi container','Infrastruktur cloud','Infrastruktur multi-region','Autoscaling','Manajemen resource','Penyimpanan objek','Pemantauan kapasitas']],
['keamanan-privasi', ['HTTPS dan TLS','Firewall aplikasi web','Perlindungan DDoS','Sistem identitas','Autentikasi multifaktor','Single sign-on','Kontrol akses berbasis peran','Manajemen sesi','Enkripsi data tersimpan','Manajemen secret dan kunci','Pemindaian kerentanan','Proteksi dependensi','Audit keamanan','Manajemen persetujuan privasi','Pencatatan aktivitas keamanan']],
['runtime-api', ['Runtime aplikasi','Backend modular','Gateway API','REST API','GraphQL','Sistem antrean pesan','Pemrosesan pekerjaan latar','Scheduler tugas','Webhook','Manajemen konfigurasi','Feature flags','Lingkungan pengembangan','Lingkungan staging','Pengujian otomatis','Dokumentasi API']],
['data-search', ['Database relasional','Database dokumen','Cache aplikasi','Replikasi database','Migrasi skema','Validasi data','Pipeline ETL ELT','Data warehouse','Mesin pencarian teks','Indeks semantik','Pengelolaan metadata','Deduplicasi data','Retensi data','Backup database','Pemulihan data']],
['ai-otomasi', ['Asisten AI','Integrasi model bahasa','Chat antarmuka terpadu','Pencarian berbantuan AI','RAG dan basis pengetahuan','Indeks embedding','Sistem evaluasi AI','Pengelolaan prompt','Kontrol izin akses AI','Otomasi alur kerja','Agen tugas terbatas','Pemrosesan dokumen','OCR','Pembuatan ringkasan','Pemantauan biaya dan penggunaan AI']],
['devops-observabilitas', ['Repositori Git','Pipeline CI CD','Build otomatis','Pengujian sebelum rilis','Deployment otomatis','GitHub Pages untuk situs statis','Pengelolaan domain','Pengaturan DNS','Sertifikat TLS otomatis','Deployment preview','Rollback versi','Log terpusat','Metrik sistem','Distributed tracing','Peringatan insiden']],
['tata-kelola', ['High availability','Disaster recovery','Rencana kesinambungan layanan','Pengujian pemulihan berkala','Target SLA dan SLO','Pengoptimalan Core Web Vitals','Optimasi aset gambar','Strategi caching','SEO teknis','Sitemap dan robots.txt','Dukungan multibahasa','Analitik penggunaan','Pengelolaan lisensi','Dokumentasi arsitektur','Dashboard tata kelola infrastruktur']]
];
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const components = [];
for (let n=1;n<=total;n++) {
  const group = groups[Math.floor((n-1)/(total/groups.length))] || groups[groups.length-1];
  const base = group[1][(n-1)%group[1].length];
  const title = n<=150 ? base : base + ' — Modul ' + String(Math.ceil(n/150)).padStart(3,'0') + ' / Unit ' + String((n-1)%150+1).padStart(3,'0');
  const id = 'reic-' + String(n).padStart(5,'0') + '-' + slug(base);
  const dir = path.join(root, id);
  fs.mkdirSync(dir,{recursive:true});
  const reic = ['--- REIC/1 ---','id: '+id,'title: "'+title.replace(/"/g,'\\"')+'"','group: '+group[0],'component_number: '+n,'style: ./'+id+'.css','script: ./'+id+'.js','render: interactive-panel','runtime: static-compatible','--- END REIC HEADER ---','',title+'. Komponen modular OS MEDIA VM dengan konfigurasi mandiri.','Fitur sisi-klien tersedia tanpa server; koneksi database, autentikasi terpusat, dan layanan AI memerlukan backend eksternal.',''].join('\n');
  const css = '[data-reic-component="'+id+'"]{font:inherit;color:var(--reic-text,#eaf0ff);background:var(--reic-panel,#101a2b);border:1px solid var(--reic-border,#293750);border-radius:14px;padding:16px;box-shadow:0 12px 34px #0002}\n[data-reic-component="'+id+'"] .reic-title{font-weight:700;font-size:1rem;margin:0 0 8px}\n[data-reic-component="'+id+'"] .reic-status{font-size:.82rem;color:var(--reic-muted,#aab8ce)}\n[data-reic-component="'+id+'"] button{font:inherit;border:1px solid var(--reic-border,#354660);border-radius:9px;padding:8px 12px;background:var(--reic-accent,#6d8dff);color:white;cursor:pointer}\n[data-reic-component="'+id+'"] button:focus-visible{outline:3px solid #a9c2ff;outline-offset:2px}\n';
  const js = "(function(){'use strict';const init=(root)=>{if(!root||root.dataset.reicReady==='1')return;root.dataset.reicReady='1';const status=root.querySelector('[data-reic-status]');const action=root.querySelector('[data-reic-action]');if(action)action.addEventListener('click',()=>{const now=new Date();if(status)status.textContent='Aktif · diperbarui '+now.toLocaleTimeString('id-ID');root.dispatchEvent(new CustomEvent('reic:action',{bubbles:true,detail:{id:'"+id+"',title:"+JSON.stringify(title)+"}}));});};if(typeof document!=='undefined'){document.querySelectorAll('[data-reic-component=\""+id+"\"]').forEach(init);document.addEventListener('reic:mount',e=>{if(e.detail&&e.detail.id==='"+id+"')init(e.target);});}if(typeof module!=='undefined'&&module.exports)module.exports={id:'"+id+"',init};})();\n";
  fs.writeFileSync(path.join(dir,id+'.reic'),reic);
  fs.writeFileSync(path.join(dir,id+'.css'),css);
  fs.writeFileSync(path.join(dir,id+'.js'),js);
  components.push({id,title,group:group[0],path:dir});
}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({name:'OS MEDIA VM REIC Components',version:1,total:components.length,filesPerComponent:3,generatedAt:new Date().toISOString(),components:components.map(({id,title,group})=>({id,title,group,reic:id+'/'+id+'.reic',css:id+'/'+id+'.css',js:id+'/'+id+'.js'}))},null,2));
console.log('Selesai: '+components.length+' komponen, '+(components.length*3)+' berkas plus manifest di '+root);
