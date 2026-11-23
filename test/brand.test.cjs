'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'../brand/koluva-repair/isotipo/svg');
test('Repair isotopes contain one simple hex nut, with no Koluva emblem behind it',()=>{for(const variant of ['color','white','ink']){const svg=fs.readFileSync(path.join(base,`koluva-repair-isotipo-${variant}.svg`),'utf8');assert.equal((svg.match(/<path/g)||[]).length,1);assert.equal((svg.match(/<circle/g)||[]).length,1);assert.match(svg,/M128 20 218 72 218 176 128 228 38 176 38 72z/);assert.match(svg,/r="41"/);assert.doesNotMatch(svg,/koluva-isotipo|rotate\(|<polygon/);}});
test('Windows app icon places a white nut on the Koluva red background',()=>{const svg=fs.readFileSync(path.join(__dirname,'../www/assets/app-icon.svg'),'utf8');assert.match(svg,/<rect[^>]+fill="#C8102E"/);assert.match(svg,/<path fill="#FFFFFF"[^>]+M128 20/);assert.match(svg,/<circle cx="128" cy="128" r="41" fill="#C8102E"/);});

