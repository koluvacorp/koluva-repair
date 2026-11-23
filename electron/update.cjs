'use strict';
/* Actualizador de Windows: manifiesto firmado (ECDSA P-256) + instalador verificado por tamaño y SHA-256. */
const crypto = require('node:crypto'), fs = require('node:fs'), path = require('node:path'), https = require('node:https');
const { pipeline } = require('node:stream/promises'), { Transform } = require('node:stream');
const HOSTS = new Set(['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com']);
const MAX_INSTALLER = 512 * 1024 * 1024;

function versionParts(v) { if (typeof v !== 'string' || !/^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.test(v)) throw Error('Versión de actualización no válida.'); return v.split('.').map(Number); }
function newer(a, b) { const x = versionParts(a), y = versionParts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; }

function verifyManifest(source, jwk, repo, channel = 'repair-stable') {
  if (Buffer.byteLength(source) > 65536) throw Error('Manifiesto demasiado grande.');
  const env = JSON.parse(source);
  if (!env || typeof env.payload !== 'string' || typeof env.signature !== 'string' || env.signature.length > 200) throw Error('Manifiesto inválido.');
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  if (!crypto.verify('sha256', Buffer.from(env.payload), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(env.signature, 'base64'))) throw Error('La firma de la actualización no es válida. No se descargó ni ejecutó el instalador.');
  const d = JSON.parse(env.payload); versionParts(d.version);
  if (channel !== 'repair-stable') throw Error('Canal de actualización no válido.');
  const w = d.windows || {}, url = `https://github.com/${repo}/releases/download/repair-v${d.version}/KoluvaRepair-${d.version}-Windows-x64-Setup.exe`;
  if (w.url !== url || !/^[a-f0-9]{64}$/.test(w.sha256 || '') || !Number.isSafeInteger(w.size) || w.size <= 0 || w.size > MAX_INSTALLER || typeof d.publishedAt !== 'string' || !Number.isFinite(Date.parse(d.publishedAt))) throw Error('Los datos de la actualización no son válidos.');
  if (d.notes && JSON.stringify(d.notes).length > 12000) throw Error('Notas demasiado largas.');
  return d;
}

function request(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    let u; try { u = new URL(url); } catch { return reject(Error('URL no válida.')); }
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !HOSTS.has(u.hostname) || redirects > 5) return reject(Error('Destino de actualización no autorizado.'));
    const req = https.get(u, { timeout: 15000, headers: { 'User-Agent': 'KoluvaRepair-Updater', Accept: 'application/octet-stream' } }, res => {
      res.on('error', reject);
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) { res.resume(); if (!res.headers.location) return reject(Error('Redirección incompleta.')); let t; try { t = new URL(res.headers.location, u).href; } catch { return reject(Error('Redirección no válida.')); } return request(t, redirects + 1).then(resolve, reject); }
      if (res.statusCode !== 200) { res.resume(); const e = Error(res.statusCode === 404 ? 'El canal todavía no tiene una versión publicada.' : 'Servidor de actualizaciones no disponible.'); e.status = res.statusCode; return reject(e); }
      res.setTimeout(30000, () => res.destroy(Error('Descarga interrumpida.')));
      const dl = setTimeout(() => res.destroy(Error('La descarga excedió diez minutos.')), 600000); dl.unref(); res.once('close', () => clearTimeout(dl));
      resolve(res);
    });
    req.on('timeout', () => req.destroy(Error('El canal no respondió.'))); req.on('error', reject);
  });
}

async function check({ jwk, repo, channel, current }) {
  let res; try { res = await request(`https://github.com/${repo}/releases/download/${channel}/latest.json`); } catch (e) { if (e.status === 404) return { status: 'unpublished' }; throw e; }
  const chunks = []; let size = 0; for await (const c of res) { size += c.length; if (size > 65536) { res.destroy(); throw Error('Manifiesto demasiado grande.'); } chunks.push(c); }
  const m = verifyManifest(Buffer.concat(chunks).toString('utf8'), jwk, repo, channel);
  return newer(m.version, current) ? { status: 'available', manifest: m } : { status: 'current' };
}

async function download(manifest, dir, onProgress) {
  const w = manifest.windows; fs.mkdirSync(dir, { recursive: true });
  for (const n of fs.readdirSync(dir)) if (/^\d+\.\d+\.\d+-[0-9a-f-]{36}\.exe(\.part)?$/.test(n)) { try { fs.unlinkSync(path.join(dir, n)); } catch {} }
  const file = path.join(dir, `${manifest.version}-${crypto.randomUUID()}.exe`), part = file + '.part'; let got = 0; const hash = crypto.createHash('sha256');
  try {
    const res = await request(w.url);
    const meter = new Transform({ transform(c, _e, cb) { got += c.length; if (got > w.size) return cb(Error('La descarga supera el tamaño firmado.')); hash.update(c); onProgress && onProgress({ pct: Math.floor(got / w.size * 100) }); cb(null, c); } });
    await pipeline(res, meter, fs.createWriteStream(part, { flags: 'wx', mode: 0o600 }));
    if (got !== w.size || hash.digest('hex') !== w.sha256) throw Error('La descarga no coincide con la versión firmada.');
    fs.renameSync(part, file); return file;
  } catch (e) { for (const f of [part, file]) if (fs.existsSync(f)) fs.unlinkSync(f); throw e; }
}
module.exports = { check, download, verifyManifest, newer, versionParts };
