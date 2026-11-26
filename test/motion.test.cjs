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
  const makeMetric = value => ({ textContent: String(value) });
  const metrics = [makeMetric(12), makeMetric(4)];
  const handlers = new Map();
  const main = {
    classList: createClassList(),
    style: { setProperty: (key, value) => styleValues.set(key, value), removeProperty: key => styleValues.delete(key) },
    querySelectorAll: selector => selector === '.metric-value' ? metrics : [],
    addEventListener: (name, fn) => handlers.set(name, fn),
    contains: () => true,
    get offsetWidth() { return 900; },
  };
  const root = {
    dataset: { theme: 'light' },
    classList: createClassList(),
    style: { setProperty: (key, value) => styleValues.set(key, value), removeProperty: key => styleValues.delete(key) },
    get offsetWidth() { return 900; },
  };
  const document = { documentElement: root, hidden: false, getElementById: id => id === 'main' ? main : null };
  let now = 0, frameId = 0;
  const frames = new Map();
  const context = {
    document,
    setTimeout: () => 1,
    clearTimeout() {},
    requestAnimationFrame: fn => { const id = ++frameId; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    performance: { now: () => now },
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
  return {
    app: context.Repair, main, root, metrics, handlers, styleValues,
    setTheme: value => { desiredTheme = value; },
    setMotion: value => { motionEnabled = value; },
    step: value => { now = value; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); },
  };
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

test('dashboard metrics count to their final values and stop with motion disabled', async () => {
  const { app, main, metrics, step, setMotion } = fixture();
  app.render();
  await app.opening();
  assert.deepEqual(metrics.map(x => x.textContent), ['0', '0']);
  step(310);
  assert.ok(Number(metrics[0].textContent) > 0 && Number(metrics[0].textContent) < 12);
  step(620);
  assert.deepEqual(metrics.map(x => x.textContent), ['12', '4']);
  setMotion(false);
  app.page = 'orders';
  app.render();
  assert.equal(main.classList.contains('enter'), false);
});

test('pointer tilt updates one hovered surface and clears on exit', () => {
  const { handlers, step, styleValues } = fixture();
  const style = {
    setProperty: (key, value) => styleValues.set(key, value),
    removeProperty: key => styleValues.delete(key),
  };
  const target = {
    style,
    matches: selector => selector === '.btn',
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 40 }),
  };
  handlers.get('pointermove')({ pointerType: 'mouse', target: { closest: () => target }, clientX: 100, clientY: 0 });
  step(10);
  assert.equal(styleValues.get('--repair-tilt-x'), '3.00deg');
  assert.equal(styleValues.get('--repair-tilt-y'), '3.00deg');
  handlers.get('pointerleave')();
  assert.equal(styleValues.has('--repair-tilt-x'), false);
});

test('motion styles stagger dashboard cards and reduced motion disables effects', () => {
  const css = fs.readFileSync(require.resolve('../www/css/app.css'), 'utf8');
  assert.match(css, /main\.enter \.page>\.grid>\*/);
  assert.match(css, /@keyframes status-fill/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /:root\[data-motion=off\] \*/);
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
