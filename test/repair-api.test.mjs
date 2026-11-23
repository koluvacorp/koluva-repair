import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { repairActivation, repairAdmin, repairAuth } from '../../KoluvaWork/koluvacorp/repair-api.js';
import license from '../electron/license.cjs';

function database(subscription = null) {
  const calls = [];
  let activation = null;
  let accountId = subscription?.account_id || null;
  return {
    calls,
    prepare(sql) { return { bind(...args) { return {
      async first() {
        calls.push({ sql, args });
        if (sql.includes('repair_license_attempts')) return null;
        if (sql.includes('FROM repair_subscriptions WHERE license_hash')) return subscription && { ...subscription, account_id: accountId };
        if (sql.includes('SELECT account_id FROM repair_subscriptions')) return { account_id: accountId };
        if (sql.includes('FROM repair_activations')) return activation;
        return null;
      },
      async run() { calls.push({ sql, args }); if (sql.includes('SET account_id = ?')) accountId = args[0]; if (sql.includes('INSERT OR IGNORE INTO repair_activations')) activation = { installation_hash: args[1] }; return { meta: { changes: 1 } }; },
      async all() { return { results: [] }; },
    }; } }; },
    async batch(stmts) { calls.push(...stmts.map(x => ({ sql: x.sql, args: x.args }))); },
  };
}

test('Admin issues a one-time Repair license code without exposing its stored hash', async () => {
  const DB = database(), request = new Request('https://koluva.com/api/admin/repair/subscriptions', { method: 'POST', body: JSON.stringify({ businessLabel: 'Taller demo', contactEmail: '', plan: 'repair-pro', expiresOn: new Date(Date.now() + 20 * license.DAY).toISOString().slice(0, 10) }) });
  const response = await repairAdmin(request, { DB }, '/api/admin/repair/subscriptions'), result = await response.json();
  assert.equal(response.status, 201);
  assert.match(result.licenseCode, /^REPAIR-[A-F0-9]{48}$/);
  assert.equal('license_hash' in result.subscription, false);
  assert.equal(DB.calls.length, 2);
});

test('paid license activation requires a signed-in Koluva account', async () => {
  const DB = database(), request = new Request('https://koluva.com/api/repair/activate', { method: 'POST', body: JSON.stringify({ code: 'REPAIR-guess', installationId: crypto.randomUUID(), appVersion: '1.0.0' }) });
  const response = await repairActivation(request, { DB, ADMIN_SESSION_SECRET: 'test-secret' }, true, async () => null);
  assert.equal(response.status, 401);
  assert.equal(DB.calls.length, 0);
});

test('invalid license formats are rejected before database access', async () => {
  const DB = database(), request = new Request('https://koluva.com/api/repair/activate', { method: 'POST', body: JSON.stringify({ code: 'REPAIR-guess', installationId: crypto.randomUUID(), appVersion: '1.0.0' }) });
  const response = await repairActivation(request, { DB, ADMIN_SESSION_SECRET: 'test-secret' }, true, async () => ({ id: crypto.randomUUID(), email: 'owner@example.test' }));
  assert.equal(response.status, 400);
  assert.equal(DB.calls.length, 0);
});

test('license activation binds one PC and returns a verifiable signed offline lease', async () => {
  const keys = crypto.generateKeyPairSync('ed25519'), code = `REPAIR-${crypto.randomBytes(24).toString('hex').toUpperCase()}`, hash = crypto.createHash('sha256').update(code).digest('hex'), installationId = crypto.randomUUID(), now = Date.now();
  const row = { id: crypto.randomUUID(), plan: 'repair-pro-plus', status: 'active', expires_on: new Date(now + 30 * license.DAY).toISOString().slice(0, 10), expires_at: now + 30 * license.DAY, license_hash: hash, account_id: null };
  const DB = database(row), privatePem = keys.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const request = new Request('https://koluva.com/api/repair/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, installationId, appVersion: '1.0.0' }) });
  const user = { id: crypto.randomUUID(), email: 'owner@example.test' };
  const response = await repairActivation(request, { DB, ADMIN_SESSION_SECRET: 'test-secret', REPAIR_LICENSE_SIGNING_KEY: privatePem }, true, async () => user), result = await response.json();
  assert.equal(response.status, 200);
  const checked = license.verifyLease(result.lease, keys.publicKey, installationId);
  assert.equal(checked.plan, 'repair-pro-plus');
  assert.equal(JSON.parse(result.lease.payload).product, 'koluva-repair');
  assert.ok(result.lease.signature);
  assert.ok(DB.calls.some(call => call.sql.includes('SET account_id = ?')));
});

test('a paid license cannot be claimed from another Koluva account', async () => {
  const keys = crypto.generateKeyPairSync('ed25519'), code = `REPAIR-${crypto.randomBytes(24).toString('hex').toUpperCase()}`, hash = crypto.createHash('sha256').update(code).digest('hex'), now = Date.now();
  const row = { id: crypto.randomUUID(), plan: 'repair-pro', status: 'active', expires_on: new Date(now + 30 * license.DAY).toISOString().slice(0, 10), expires_at: now + 30 * license.DAY, license_hash: hash, account_id: crypto.randomUUID() };
  const DB = database(row), request = new Request('https://koluva.com/api/repair/status', { method: 'POST', body: JSON.stringify({ code, installationId: crypto.randomUUID(), appVersion: '1.0.0' }) });
  const response = await repairActivation(request, { DB, ADMIN_SESSION_SECRET: 'test-secret', REPAIR_LICENSE_SIGNING_KEY: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }) }, false, async () => ({ id: crypto.randomUUID(), email: 'other@example.test' }));
  assert.equal(response.status, 403);
});

test('Repair password recovery and verification resend use the shared account routes without exposing account existence', async t => {
  const previousFetch = globalThis.fetch, requests = [];
  t.after(() => { globalThis.fetch = previousFetch; });
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), body: options?.body });
    return new Response(JSON.stringify({ msg: requests.length === 1 ? 'Invalid email.' : 'If this email exists, we sent a message.' }), { status: requests.length === 1 ? 400 : 200, headers: { 'Content-Type': 'application/json' } });
  };
  const DB = { prepare() { return { bind() { return { async first() { return null; }, async run() { return { meta: { changes: 1 } }; } }; } }; } };
  for (const action of ['recover', 'resend']) {
    const request = new Request(`https://koluva.com/api/repair/auth/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@example.test', lang: 'es' }) });
    const response = await repairAuth(request, { DB }, `/api/repair/auth/${action}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  }
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /\/auth\/v1\/recover\?/);
  assert.match(requests[1].url, /\/auth\/v1\/resend\?/);
});

test('Repair Google OAuth starts only with valid PKCE and returns a short-lived state cookie', async t => {
  const previousFetch = globalThis.fetch, state = crypto.randomBytes(32).toString('base64url');
  t.after(() => { globalThis.fetch = previousFetch; });
  globalThis.fetch = async () => new Response(null, { status: 302, headers: { Location: 'https://accounts.google.com/o/oauth2/auth?client_id=test' } });
  const challenge = crypto.randomBytes(32).toString('base64url');
  const request = new Request(`https://koluva.com/api/repair/auth/google?app=repair&state=${state}&code_challenge=${challenge}`);
  const response = await repairAuth(request, {}, '/api/repair/auth/google');
  assert.equal(response.status, 302);
  assert.match(response.headers.get('Set-Cookie'), new RegExp(`koluva_g_app=repair\\.${state}`));
  const invalid = new Request('https://koluva.com/api/repair/auth/google?app=repair&state=bad&code_challenge=bad');
  assert.equal((await repairAuth(invalid, {}, '/api/repair/auth/google')).status, 400);
});
