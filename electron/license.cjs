'use strict';

const crypto = require('node:crypto');
const DAY = 86400000;
const PLANS = Object.freeze({
  free: Object.freeze({ activeOrders: 20, parts: 40, encryptedBackup: false }),
  'repair-pro': Object.freeze({ activeOrders: 100, parts: 500, encryptedBackup: false }),
  'repair-pro-plus': Object.freeze({ activeOrders: Infinity, parts: Infinity, encryptedBackup: true }),
});
function olderVersion(current, minimum) { const a=String(current||'0.0.0').split('.').map(Number),b=String(minimum||'0.0.0').split('.').map(Number);for(let i=0;i<3;i++){if((a[i]||0)<(b[i]||0))return true;if((a[i]||0)>(b[i]||0))return false;}return false; }

function verifyLease(envelope, publicKey, installationId, now = Date.now(), lastTrustedAt = 0, appVersion = '1.0.0') {
  if (!envelope || typeof envelope.payload !== 'string' || envelope.payload.length > 4096 ||
      typeof envelope.signature !== 'string' || envelope.signature.length > 128) throw Error('invalid-license');
  const signature = Buffer.from(envelope.signature, 'base64');
  if (signature.length !== 64 || !crypto.verify(null, Buffer.from(envelope.payload), publicKey, signature)) throw Error('invalid-license-signature');
  const payload = JSON.parse(envelope.payload);
  const expected = crypto.createHash('sha256').update(`${payload.licenseId}:${installationId}`).digest('hex');
  if (payload.format !== 1 || payload.product !== 'koluva-repair' || !Object.hasOwn(PLANS, payload.plan) || payload.plan === 'free' ||
      !Number.isSafeInteger(payload.expiresAt) || !Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.validUntil) ||
      payload.expiresAt <= payload.issuedAt || payload.validUntil > payload.expiresAt || payload.validUntil > payload.issuedAt + 7 * DAY ||
      payload.installationHash !== expected || typeof payload.expiresOn !== 'string' || !/^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.test(payload.minAppVersion || '')) throw Error('invalid-license-payload');
  if (now < Math.max(payload.issuedAt, lastTrustedAt) - 300000) return { plan: 'free', status: 'clock-check', expiresOn: payload.expiresOn, daysLeft: null, contact: {} };
  if (olderVersion(appVersion,payload.minAppVersion)) return { plan: 'free', status: 'update-required', expiresOn: payload.expiresOn, daysLeft: null, minAppVersion: payload.minAppVersion, contact: {} };
  if (now >= payload.expiresAt) return { plan: 'free', status: 'expired', expiresOn: payload.expiresOn, daysLeft: 0, contact: {} };
  if (now >= payload.validUntil) return { plan: 'free', status: 'needs-online', expiresOn: payload.expiresOn, daysLeft: Math.ceil((payload.expiresAt-now)/DAY), contact: {} };
  return { plan: payload.plan, status: now - (lastTrustedAt || payload.issuedAt) >= 6 * DAY ? 'offline' : 'active', expiresOn: payload.expiresOn,
    daysLeft: Math.max(0, Math.ceil((payload.expiresAt-now)/DAY)), validUntil: payload.validUntil, minAppVersion: payload.minAppVersion };
}

function licenseInfo(state, publicKey, now = Date.now(), appVersion = '1.0.0') {
  if (!state?.lease) return { plan: 'free', status: 'inactive', expiresOn: null, daysLeft: null, limits: PLANS.free, contact: {} };
  try {
    const info = verifyLease(state.lease, publicKey, state.installationId, now, state.lastTrustedAt || 0, appVersion);
    const contact = info.daysLeft !== null && info.daysLeft <= 7 ? state.contact || {} : {};
    return { ...info, limits: PLANS[info.plan] || PLANS.free, contact: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email || '') ? contact.email : '',
    } };
  } catch { return { plan: 'free', status: 'invalid', expiresOn: null, daysLeft: null, limits: PLANS.free, contact: {} }; }
}

module.exports = { DAY, PLANS, olderVersion, verifyLease, licenseInfo };
