'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const oauth = require('../electron/oauth.cjs');

test('creates a PKCE verifier, state and matching S256 challenge', () => {
  const flow = oauth.beginOAuth(1000);
  assert.match(flow.verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.match(flow.state, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(flow.challenge, crypto.createHash('sha256').update(flow.verifier).digest('base64url'));
  assert.equal(flow.expiresAt, 601000);
});

test('accepts only the registered callback with the live matching state', () => {
  const pending = oauth.beginOAuth(1000);
  const raw = `koluva-repair://auth?code=authorization_code_123&state=${pending.state}`;
  assert.deepEqual(oauth.acceptOAuthCallback(raw, pending, 2000), { code: 'authorization_code_123', verifier: pending.verifier });
  assert.throws(() => oauth.acceptOAuthCallback(`https://koluva.com/?code=authorization_code_123&state=${pending.state}`, pending, 2000), /invalid-oauth-url/);
  assert.throws(() => oauth.acceptOAuthCallback('koluva-repair://auth?code=authorization_code_123&state=wrong', pending, 2000), /invalid-oauth-state/);
  assert.throws(() => oauth.acceptOAuthCallback(raw, pending, pending.expiresAt), /expired-oauth-state/);
});

test('returns a cancellation without exchanging an authorization code', () => {
  const pending = oauth.beginOAuth();
  const raw = `koluva-repair://auth?error=access_denied&state=${pending.state}`;
  assert.deepEqual(oauth.acceptOAuthCallback(raw, pending), { cancelled: true });
});
