'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const styleValues = new Map();
  const createClassList = () => {
    const names = new Set();
    return {
      add: (...values) => values.forEach(value => names.add(value)),
      remove: (...values) => values.forEach(value => names.delete(value)),
      contains: value => names.has(value),
    };
  };
  const main = { classList: createClassList(), get offsetWidth() { return 900; } };
  const root = {
    dataset: { theme: 'light' },
    classList: createClassList(),
    style: { setProperty: (key, value) => styleValues.set(key, value), removeProperty: key => styleValues.delete(key) },
    get offsetWidth() { return 900; },
  };
  const document = { documentElement: root, getElementById: id => id === 'main' ? main : null };
  const context = {
    document,
    setTimeout: () => 1,
    clearTimeout() {},
    window: {},
    Repair: null,
  };
  let desiredTheme = 'light', motionEnabled = true;
  context.Repair = context.window.Repair = {
    page: 'home', orderId: '', settingsTab: 'general',
    render() { main.classList.remove('enter'); },
    opening: async () => {},
    applyPrefs() { root.dataset.theme = desiredTheme; },
    motionOn: () => motionEnabled,
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../www/js/motion.js'), 'utf8'), context);
  return { app: context.Repair, main, root, styleValues, setTheme: value => { desiredTheme = value; }, setMotion: value => { motionEnabled = value; } };
}

test('only animates a changed view and the reveal after the opening sequence', async () => {
  const { app, main } = fixture();
  app.render();
  assert.equal(main.classList.contains('enter'), false);
  app.page = 'orders';
  app.render();
  assert.equal(main.classList.contains('enter'), true);
  app.render();
  assert.equal(main.classList.contains('enter'), false);
  await app.opening();
  assert.equal(main.classList.contains('enter'), true);
});

test('theme reveal uses one opacity layer and respects disabled motion', () => {
  const { app, root, styleValues, setTheme, setMotion } = fixture();
  app.applyPrefs();
  setTheme('dark');
  app.applyPrefs();
  assert.equal(root.classList.contains('theme-reveal'), true);
  assert.equal(root.classList.contains('theme-reveal-active'), true);
  assert.equal(styleValues.get('--theme-cover'), '#FFFFFF');
  root.classList.remove('theme-reveal', 'theme-reveal-active');
  setTheme('light');
  app.applyPrefs();
  assert.equal(styleValues.get('--theme-cover'), '#141416');
  root.classList.remove('theme-reveal', 'theme-reveal-active');
  setTheme('dark');
  setMotion(false);
  app.applyPrefs();
  assert.equal(root.classList.contains('theme-reveal'), false);
});
