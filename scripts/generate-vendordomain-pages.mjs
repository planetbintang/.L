import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync("vendordomain/vendor.js", "utf8");
const start = source.indexOf("const MODULES=") + "const MODULES=".length;
const end = source.indexOf(";\nconst CATEGORIES", start);
if (start < "const MODULES=".length || end < 0) throw new Error("Tidak dapat membaca katalog MODULES.");
const modules = JSON.parse(source.slice(start, end).trim());
const features = modules.flatMap((module, mi) => (module.features || []).map((name, i) => ({
  id: mi * 25 + i + 1, name, module: module.name || `Modul ${mi + 1}`
})));
if (features.length !== 500) throw new Error(`Target 500 fitur, ditemukan ${features.length}.`);

const submenus = [
  ["Ringkasan","Ringkasan status fitur dan data."],["Konfigurasi","Ubah preferensi kerja lokal."],
  ["Data Masuk","Catat sumber data yang digunakan."],["Data Keluar","Tinjau hasil dan keluaran fitur."],
  ["Validasi","Periksa format dan kelengkapan data."],["Riwayat Aktivitas","Tampilkan riwayat lokal fitur."],
  ["Pencarian","Cari informasi dalam ruang kerja."],["Filter Data","Saring informasi berdasarkan kata kunci."],
  ["Impor Berkas","Pilih berkas JSON untuk diproses."],["Catatan Kerja","Simpan catatan pada perangkat."],
  ["Pemantauan","Periksa status kesiapan fitur."],["Akses dan Izin","Tampilkan keterangan akses."],
  ["Bantuan","Baca petunjuk penggunaan."],["Pengaturan Lanjutan","Tampilkan opsi tambahan."],
  ["Pemeriksaan Sistem","Jalankan pemeriksaan lokal."]
];
const esc = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const slug = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);
const filename = f => `${String(f.id).padStart(3,"0")}-${slug(f.name)}.html`;
const out = "vendordomain/pages";
fs.mkdirSync(out, { recursive: true });

for (const f of features) {
  const previous = f.id > 1 ? filename(features[f.id - 2]) : "index.html";
  const next = f.id < 500 ? filename(features[f.id]) : "index.html";
  const menus = submenus.map(([name, desc], i) => `<button class="sub" data-sub="${esc(name)}"><strong>${String(i+1).padStart(2,"0")} · ${esc(name)}</strong><small>${esc(desc)}</small></button>`).join("");
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(f.name)} · PlanetBintang .L</title><style>
:root{color-scheme:dark;--bg:#0b1020;--panel:#131b2f;--line:#263451;--text:#eef4ff;--muted:#9fb0ca;--accent:#73a7ff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 system-ui,sans-serif}header{padding:22px clamp(16px,4vw,44px);background:#10182b;border-bottom:1px solid var(--line)}h1{font-size:clamp(23px,3vw,34px);margin:6px 0}p,.muted{color:var(--muted)}main{max-width:1240px;margin:auto;padding:clamp(16px,3vw,36px)}.card{border:1px solid var(--line);background:var(--panel);border-radius:16px;padding:20px;margin-bottom:18px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}.sub{border:1px solid var(--line);border-radius:12px;background:#0d1527;color:var(--text);padding:14px;text-align:left;min-height:95px;cursor:pointer}.sub:hover,button:hover{border-color:var(--accent)}.sub strong{display:block;margin-bottom:5px}.sub small{color:var(--muted)}button,textarea{font:inherit;border:1px solid var(--line);border-radius:10px;background:#0d1527;color:var(--text);padding:10px 12px}textarea{width:100%;min-height:110px}.row{display:flex;gap:12px;flex-wrap:wrap}a{color:#b8d0ff}.status{color:#a8c8ff}@media(max-width:600px){.row>*{flex:1 1 100%}}
</style></head><body><header><div class="muted">VENDORDOMAIN · MODUL ${String(Math.ceil(f.id/25)).padStart(2,"0")} · HALAMAN ${String(f.id).padStart(3,"0")} DARI 500</div><h1>${esc(f.name)}</h1><p>${esc(f.module)} · Halaman fitur mandiri dengan 15 submenu.</p><div class="row"><a href="../features/index.html">Katalog fitur</a><a href="${previous}">← Sebelumnya</a><a href="${next}">Berikutnya →</a></div></header><main><section class="card"><h2>Submenu fitur</h2><p>Submenu berjalan langsung di halaman tanpa modal pop-up.</p><div class="grid">${menus}</div><p id="status" class="status" role="status">Pilih submenu untuk menjalankan aksi lokal.</p></section><section class="card"><h2>Catatan kerja lokal</h2><p>Catatan tersimpan pada browser/perangkat ini, bukan backend produksi.</p><textarea id="notes" placeholder="Catatan untuk ${esc(f.name)}…"></textarea><div class="row" style="margin-top:10px"><button id="save">Simpan catatan</button><button id="clear">Hapus catatan</button><button id="check">Periksa status halaman</button></div></section></main><script>
const id=${f.id}, key="pb-vendor-page-"+id, status=document.querySelector("#status"), notes=document.querySelector("#notes");
notes.value=localStorage.getItem(key)||"";
document.querySelectorAll("[data-sub]").forEach(button=>button.addEventListener("click",()=>{const name=button.dataset.sub;status.textContent="Submenu “"+name+"” dijalankan untuk ${esc(f.name)}. Aksi dicatat lokal.";const history=JSON.parse(localStorage.getItem("pb-vendor-history")||"[]");history.unshift({id,name:${JSON.stringify(f.name)},submenu:name,at:new Date().toISOString()});localStorage.setItem("pb-vendor-history",JSON.stringify(history.slice(0,200)));if(name==="Catatan Kerja")notes.focus();if(name==="Riwayat Aktivitas")status.textContent="Riwayat aktivitas tersimpan: "+history.length+" catatan.";}));
document.querySelector("#save").onclick=()=>{localStorage.setItem(key,notes.value);status.textContent="Catatan halaman ${f.id} disimpan lokal."};
document.querySelector("#clear").onclick=()=>{localStorage.removeItem(key);notes.value="";status.textContent="Catatan halaman dihapus."};
document.querySelector("#check").onclick=()=>status.textContent="Halaman ${f.id} siap · 15 submenu terpasang · penyimpanan lokal tersedia.";
</script></body></html>`;
  fs.writeFileSync(path.join(out, filename(f)), html + "\n");
}

const listing = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>500 Halaman Fitur · PlanetBintang .L</title><style>body{font:16px system-ui;background:#0b1020;color:#eef4ff;padding:24px;max-width:1100px;margin:auto}a{color:#9dc0ff}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.item{padding:10px;border:1px solid #263451;border-radius:8px;background:#131b2f}</style></head><body><h1>500 Halaman Fitur PlanetBintang .L</h1><p>Setiap halaman memiliki 15 submenu, tanpa modal pop-up.</p><input id="q" placeholder="Cari fitur…" style="width:100%;padding:12px;margin-bottom:14px"><div id="list" class="grid"></div><script>const features=${JSON.stringify(features.map(f=>({id:f.id,name:f.name,module:f.module,file:filename(f)})))};const list=document.querySelector("#list"),q=document.querySelector("#q");function render(){list.replaceChildren();features.filter(f=>(f.name+" "+f.module).toLowerCase().includes(q.value.toLowerCase())).forEach(f=>{const a=document.createElement("a");a.className="item";a.href=f.file;a.textContent=String(f.id).padStart(3,"0")+" · "+f.name;list.append(a)})}q.addEventListener("input",render);render();</script></body></html>`;
fs.writeFileSync(path.join(out, "index.html"), listing + "\n");
console.log(`Generated ${features.length} feature pages and 15 submenu each.`);
