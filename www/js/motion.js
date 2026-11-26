'use strict';
(function (g) {
  const L = g.Repair;
  if (!L) return;

  const main = document.getElementById('main');
  const viewKey = () => `${L.page}|${L.orderId}|${L.settingsTab}`;
  const originalRender = L.render;
  let lastView = '';
  let countFrame = 0;
  let countRun = 0;
  let tiltFrame = 0;
  let pendingTilt = null;
  let tiltedElement = null;
  let themeTimer = 0;

  const motionOn = () => L.motionOn();
  const clearTilt = () => {
    if (tiltFrame) cancelAnimationFrame(tiltFrame);
    tiltFrame = 0;
    pendingTilt = null;
    if (tiltedElement) {
      tiltedElement.style.removeProperty('--repair-tilt-x');
      tiltedElement.style.removeProperty('--repair-tilt-y');
    }
    tiltedElement = null;
  };
  const stopCountUp = () => {
    countRun++;
    if (countFrame) cancelAnimationFrame(countFrame);
    countFrame = 0;
  };
  const animateCounters = () => {
    stopCountUp();
    if (!main || !motionOn() || document.hidden) return;
    const values = [...main.querySelectorAll('.metric-value')]
      .map(el => ({ el, text: el.textContent.trim(), value: Number(el.textContent.trim()) }))
      .filter(x => /^\d+$/.test(x.text) && Number.isSafeInteger(x.value) && x.value > 0 && x.value <= 9999);
    if (!values.length) return;

    const run = countRun;
    const start = performance.now();
    values.forEach(x => { x.el.textContent = '0'; });
    const tick = now => {
      if (run !== countRun) return;
      if (!motionOn() || document.hidden) {
        values.forEach(x => { x.el.textContent = x.text; });
        countFrame = 0;
        return;
      }
      const progress = Math.min(1, Math.max(0, (now - start) / 620));
      const eased = 1 - Math.pow(1 - progress, 3);
      values.forEach(x => {
        x.el.textContent = progress === 1 ? x.text : String(Math.round(x.value * eased));
      });
      if (progress < 1) countFrame = requestAnimationFrame(tick);
      else countFrame = 0;
    };
    countFrame = requestAnimationFrame(tick);
  };

  L.render = function (...args) {
    const nextView = viewKey();
    const changed = lastView !== '' && nextView !== lastView;
    clearTilt();
    stopCountUp();
    main?.classList.remove('enter');
    const result = originalRender.apply(this, args);
    lastView = nextView;
    if (changed && motionOn() && main) {
      void main.offsetWidth;
      main.classList.add('enter');
      if (L.page === 'home') animateCounters();
    }
    return result;
  };

  const originalOpening = L.opening;
  L.opening = async function (...args) {
    await originalOpening.apply(this, args);
    if (motionOn() && main) {
      main.classList.remove('enter');
      void main.offsetWidth;
      main.classList.add('enter');
      if (L.page === 'home') animateCounters();
    }
  };

  if (main) {
    main.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !motionOn()) {
        clearTilt();
        return;
      }
      const element = event.target.closest('.btn:not(:disabled), .card');
      if (!element || !main.contains(element)) {
        clearTilt();
        return;
      }
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (tiltedElement && tiltedElement !== element) {
        tiltedElement.style.removeProperty('--repair-tilt-x');
        tiltedElement.style.removeProperty('--repair-tilt-y');
      }
      const strength = element.matches('.btn') ? 3 : 1.7;
      pendingTilt = {
        element,
        x: ((event.clientY - rect.top) / rect.height - 0.5) * -2 * strength,
        y: ((event.clientX - rect.left) / rect.width - 0.5) * 2 * strength,
      };
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = 0;
        if (!pendingTilt || !motionOn()) return;
        const next = pendingTilt;
        next.element.style.setProperty('--repair-tilt-x', `${next.x.toFixed(2)}deg`);
        next.element.style.setProperty('--repair-tilt-y', `${next.y.toFixed(2)}deg`);
        tiltedElement = next.element;
        pendingTilt = null;
      });
    });
    main.addEventListener('pointerleave', clearTilt);
  }

  const originalApplyPrefs = L.applyPrefs;
  L.applyPrefs = function (...args) {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    const result = originalApplyPrefs.apply(this, args);
    const next = root.dataset.theme;
    if (previous && previous !== next) {
      clearTimeout(themeTimer);
      if (motionOn()) {
        root.style.setProperty('--theme-cover', previous === 'dark' ? '#141416' : '#FFFFFF');
        root.classList.remove('theme-reveal-active');
        root.classList.add('theme-reveal');
        void root.offsetWidth;
        root.classList.add('theme-reveal-active');
        themeTimer = setTimeout(() => {
          root.classList.remove('theme-reveal', 'theme-reveal-active');
          root.style.removeProperty('--theme-cover');
        }, 460);
      } else {
        root.classList.remove('theme-reveal', 'theme-reveal-active');
        root.style.removeProperty('--theme-cover');
      }
    }
    return result;
  };
})(globalThis);
