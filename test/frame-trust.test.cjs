'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { isTrustedAppFrame } = require('../electron/frame-trust.cjs');

test('accepts the same local app path when Windows changes drive/path casing', () => {
  assert.equal(isTrustedAppFrame('file:///C:/Program%20Files/Koluva/index.html', 'file:///c:/program%20files/Koluva/index.html', 'win32'), true);
});

test('rejects other local files, remote origins and URL decorations', () => {
  const app = pathToFileURL('C:\\Program Files\\Koluva\\index.html').href;
  assert.equal(isTrustedAppFrame('file:///C:/Program%20Files/Koluva/other.html', app, 'win32'), false);
  assert.equal(isTrustedAppFrame('https://koluva.com/index.html', app, 'win32'), false);
  assert.equal(isTrustedAppFrame(`${app}?unexpected=1`, app, 'win32'), false);
  assert.equal(isTrustedAppFrame(`${app}#unexpected`, app, 'win32'), false);
  assert.equal(isTrustedAppFrame('not a URL', app, 'win32'), false);
});
