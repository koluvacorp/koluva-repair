'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const U = require('../electron/update.cjs');
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }), jwk = publicKey.export({ format: 'jwk' });
const REPO = 'koluvacorp/koluva-repair', v = '1.2.3';
const sign = p => { const payload = JSON.stringify(p); return JSON.stringify({ payload, signature: crypto.sign('sha256', Buffer.from(payload), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64') }); };
const good = () => ({ version: v, publishedAt: new Date().toISOString(), notes: { es: 'a', en: 'b', pt: 'c', fr: 'd' }, windows: { url: `https://github.com/${REPO}/releases/download/repair-v${v}/KoluvaRepair-${v}-Windows-x64-Setup.exe`, size: 10, sha256: 'a'.repeat(64) } });
test('acepta manifiesto firmado', () => assert.equal(U.verifyManifest(sign(good()), jwk, REPO).version, v));
test('rechaza firma ajena o payload alterado', () => {
  const other = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).publicKey.export({ format: 'jwk' });
  assert.throws(() => U.verifyManifest(sign(good()), other, REPO), /firma/);
  const env = JSON.parse(sign(good())); env.payload = env.payload.replace('"size":10', '"size":11'); assert.throws(() => U.verifyManifest(JSON.stringify(env), jwk, REPO), /firma/);
});
test('rechaza URL fuera del repo, hash inválido y tamaños absurdos', () => {
  const a = good(); a.windows.url = 'https://evil.example/x.exe'; assert.throws(() => U.verifyManifest(sign(a), jwk, REPO), /no son válidos/);
  const b = good(); b.windows.sha256 = 'zz'; assert.throws(() => U.verifyManifest(sign(b), jwk, REPO), /no son válidos/);
  const c = good(); c.windows.size = 9e9; assert.throws(() => U.verifyManifest(sign(c), jwk, REPO), /no son válidos/);
});
test('versiones', () => { assert.ok(U.newer('1.0.1', '1.0.0')); assert.ok(!U.newer('1.0.0', '1.0.0')); assert.throws(() => U.versionParts('x'), /no válida/); });
test('el manifiesto queda ligado al canal Repair', () => { const env=JSON.parse(sign(good()));assert.throws(()=>U.verifyManifest(JSON.stringify(env),jwk,REPO,'ledger-stable'),/Canal/);const p=good();p.windows.url=p.windows.url.replace('koluva-repair','koluva-ledger');assert.throws(()=>U.verifyManifest(sign(p),jwk,REPO),/no son válidos/);});
