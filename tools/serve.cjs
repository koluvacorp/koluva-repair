'use strict';
// Servidor estático mínimo para probar www/ en el navegador (solo desarrollo).
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../www');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^[/\\]+/, '') || 'index.html';
  const f = path.resolve(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('404'); }
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(r);
}).listen(5177, '127.0.0.1');
