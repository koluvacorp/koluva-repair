'use strict';
const crypto = require('node:crypto');

function beginOAuth(now = Date.now()) {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const state = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, state, challenge, expiresAt: now + 10 * 60 * 1000 };
}

function acceptOAuthCallback(rawUrl, pending, now = Date.now()) {
  let url;
  try { url = new URL(rawUrl); } catch { throw Error('invalid-oauth-url'); }
  if (url.protocol !== 'koluva-repair:' || url.hostname !== 'auth' || url.pathname !== '') throw Error('invalid-oauth-url');
  const state = url.searchParams.get('state') || '';
  if (!pending || !/^[A-Za-z0-9_-]{43}$/.test(pending.state || '') || !/^[A-Za-z0-9_-]{43}$/.test(pending.verifier || '') || pending.expiresAt <= now) throw Error('expired-oauth-state');
  if (state.length !== pending.state.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(pending.state))) throw Error('invalid-oauth-state');
  const error = url.searchParams.get('error');
  if (error) return { cancelled: true };
  const code = url.searchParams.get('code') || '';
  if (!/^[A-Za-z0-9._~-]{10,2048}$/.test(code)) throw Error('invalid-oauth-code');
  return { code, verifier: pending.verifier };
}

module.exports = { beginOAuth, acceptOAuthCallback };
