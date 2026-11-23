'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=process.env.KOLUVA_REPAIR_KEY_DIR||'D:/KoluvaVault/06 Seguridad/Koluva Repair';
const privatePath=path.join(dir,'repair-update-private.pem'),publicPath=path.join(root,'www/assets/update-public.json');
if(fs.existsSync(privatePath)){console.log('La clave de firma ya existe; no se sobrescribió.');process.exit(0);}
fs.mkdirSync(dir,{recursive:true});const pair=crypto.generateKeyPairSync('ec',{namedCurve:'P-256'});
fs.writeFileSync(privatePath,pair.privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx',mode:0o600});
fs.writeFileSync(publicPath,JSON.stringify(pair.publicKey.export({format:'jwk'}))+'\n',{flag:'wx',mode:0o600});
console.log('Clave de actualización creada fuera del repositorio. La clave pública quedó en www/assets/update-public.json.');
