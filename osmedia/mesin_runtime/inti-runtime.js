/* Inti runtime web OS MEDIA VM — seluruh pesan sistem menggunakan bahasa Indonesia. */
(function(global){
"use strict";
const versi="0.3.0";
const namaSistem="OS MEDIA VM";
const keadaan={siap:true,mode:"web-statis",versi,fiturAktif:["pencarian aplikasi","pemuatan manifes","penjelajah modul","pemeriksaan berkas"],fiturBelumAktif:["pelaksanaan proses sistem operasi","akses peladen","layanan latar belakang"]};
function bersihkan(teks){return String(teks??"").replace(/[&<>"]/g,karakter=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[karakter]));}
async function bacaManifes(aplikasi){const alamat="../berkas_sistem/"+aplikasi.kategori+"/"+aplikasi.berkas;const jawaban=await fetch(alamat,{cache:"no-cache"});if(!jawaban.ok)throw new Error("Berkas aplikasi tidak dapat dibaca: "+aplikasi.berkas);return jawaban.json();}
global.IntiRuntimeVM={versi,namaSistem,keadaan,bersihkan,bacaManifes};
})(window);
