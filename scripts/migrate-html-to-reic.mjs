#!/usr/bin/env node
/**
 * Migrasi sumber antarmuka HTML menjadi berkas sumber .reic.
 * Deployment Pages dapat merekonstruksi .html dari .reic saat membangun artefak.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).filter(f=>f.toLowerCase().endsWith('.html'));
let renamed=0,skipped=0;
for(const file of files){
 const target=file.slice(0,-5)+'.reic';
 if(fs.existsSync(target)){console.log('Lewati tujuan sudah ada: '+target);skipped++;continue;}
 fs.renameSync(file,target);renamed++;
}
console.log('Migrasi selesai: '+renamed+' file HTML menjadi REIC; '+skipped+' dilewati karena konflik nama.');
