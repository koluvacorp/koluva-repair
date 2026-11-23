'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createStore(fileText) {
  const calls = [];
  let stateText = '';
  const data = {
    schema: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    shop: { name: '', kind: 'repair-shop', currency: 'ARS', email: '', phone: '', address: '' },
    settings: { lang: 'es', theme: 'system', motion: 'system', opening: true, autoUpdate: true, paper: 'a4', printWidth: 80, printHeight: 120, tourDone: false },
    categories: ['phone'], statuses: ['received'], orders: [], parts: [],
  };
  const context = {
    window: {},
    document: { hidden: false },
    addEventListener() {},
    setTimeout() { return 1; },
    clearTimeout() {},
    structuredClone,
    JSON,
    Map,
    Set,
    Promise,
    Error,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    crypto: require('node:crypto').webcrypto,
  };
  context.window.RepairCore = { sanitize: value => value, emptyState: () => data };
  context.window.repairHost = {
    save: async text => { calls.push('save'); stateText = text; },
    openFile: async () => { calls.push('open'); return { name: 'backup.krepair', text: fileText }; },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../www/js/store.js'), 'utf8'), context);
  return { store: context.window.RepairStore, calls, read: () => stateText };
}

test('portable backup import flushes current edits before opening and replacing state', async () => {
  const backup = { format: 'koluva-repair-backup', version: 1, data: { schema: 1, shop: {}, settings: {}, orders: [], parts: [] }, files: [] };
  const { store, calls, read } = createStore(JSON.stringify(backup));
  store.state = { schema: 1, marker: 'unsaved current data' };
  assert.equal(await store.importFile(), true);
  assert.deepEqual(calls, ['save', 'open', 'save']);
  assert.equal(JSON.parse(read()).schema, 1);
  assert.deepEqual(JSON.parse(read()).orders, []);
});

test('encrypted backup import flushes pending edits before password validation', async () => {
  const { store, calls } = createStore('');
  store.state = { schema: 1, marker: 'unsaved current data' };
  await assert.rejects(store.importEncrypted('{}', 'short'), /weak-backup-pass/);
  assert.deepEqual(calls, ['save']);
});
