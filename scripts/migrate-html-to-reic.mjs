#!/usr/bin/env node
/**
 * Migrasi sumber antarmuka HTML menjadi berkas sumber .reic.
 * Manifest dipakai untuk merekonstruksi halaman web pada artefak GitHub Pages.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const manifest='scripts/html-reic-migration-manifest.txt';
const prior=fs.existsSync(manifest)?fs.readFileSync(manifest,'utf8').split('\n').filter(Boolean):[];
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).filter(f=>f.toLowerCase().endsWith('.html'));
const migrated=new Set(prior);
let renamed=0,skipped=0;
for(const file of files){
 const target=file.slice(0,-5)+'.reic';
 if(fs.existsSync(target)){console.log('Lewati tujuan sudah ada: '+target);skipped++;continue;}
 fs.renameSync(file,target);migrated.add(target);renamed++;
}
fs.writeFileSync(manifest,[...migrated].sort().join('\n')+'\n');
console.log('Migrasi selesai: '+renamed+' file HTML menjadi REIC; '+skipped+' dilewati karena konflik nama. Total manifest: '+migrated.size);
