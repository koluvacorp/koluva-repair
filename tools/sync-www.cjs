'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),pkg=require('../package.json'),rel=require('../release.config.json');
if(rel.repo!=='koluvacorp/koluva-repair'||rel.appId!=='com.koluva.repair'||rel.channelTag!=='repair-stable')throw Error('La configuración de publicación no coincide con Koluva Repair.');
fs.writeFileSync(path.join(root,'www/js/config.js'),`window.REPAIR_CFG=${JSON.stringify({version:pkg.version,repo:rel.repo})};\n`);
for(const f of ['koluva-repair-isotipo-color.svg','koluva-repair-isotipo-white.svg','koluva-repair-isotipo-ink.svg','repair-isotipo-pattern.svg','app-icon.ico','app-icon.png','update-public.json','koluva-intro.js','koluva-intro.css'])if(!fs.existsSync(path.join(root,'www/assets',f)))throw Error(`Falta www/assets/${f}`);
console.log(`Koluva Repair ${pkg.version}: recursos verificados.`);
