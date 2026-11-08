/* Aireber configuration: local preferences and robotics development specification. */
(() => {
  'use strict';
  const KEY = 'planetbintang.aireber.system-config.v1';
  const fields = ['cfgNoRag','cfgPbOnly','cfgNoExternal','cfgModel','cfgEndpoint','robotName','robotPurpose','robotHardware','robotSensors','robotActuators','robotDataset','robotSafety','robotResponse'];
  const defaults = {cfgNoRag:true,cfgPbOnly:true,cfgNoExternal:true,robotName:'Aireber Robotics Core',robotResponse:'Jawab jelas, terstruktur, relevan; nyatakan ketidakpastian; jangan mengarang data, sumber, atau tindakan.'};
  const read = () => { try { return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}; } catch { return {...defaults}; } };
  const collect = () => Object.fromEntries(fields.map(id => { const el=document.getElementById(id); return [id,el ? (el.type==='checkbox'?el.checked:el.value.trim()) : defaults[id]]; }));
  const apply = value => fields.forEach(id => { const el=document.getElementById(id); if(el && value[id]!==undefined){ if(el.type==='checkbox') el.checked=Boolean(value[id]); else el.value=value[id]; }});
  const status = message => { const el=document.getElementById('reberConfigStatus'); if(el) el.textContent=message; };
  const save = () => { const value=collect(); try { localStorage.setItem(KEY,JSON.stringify(value)); status('Konfigurasi disimpan pada perangkat ini. Tidak ada secret/API key yang disimpan.'); window.dispatchEvent(new CustomEvent('aireber:config-change',{detail:value})); return value; } catch { status('Penyimpanan lokal gagal. Periksa ruang penyimpanan browser.'); return null; } };
  apply(read());
  document.getElementById('saveReberConfig')?.addEventListener('click',save);
  document.getElementById('resetReberConfig')?.addEventListener('click',()=>{apply(defaults);save();});
  document.getElementById('exportReberConfig')?.addEventListener('click',()=>{const value=collect();const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='aireber-system-config.json';a.click();URL.revokeObjectURL(url);status('File konfigurasi JSON diekspor.');});
  window.AireberConfig = { get:read, save };
  status('Mode awal: tanpa RAG, konteks PlanetBintang saja, tanpa referensi eksternal.');
})();
