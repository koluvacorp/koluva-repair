'use strict';
(function (g) {
  const L = g.Repair;
  if (!L) return;

  const viewKey = () => `${L.page}|${L.orderId}|${L.settingsTab}`;
  const originalRender = L.render;
  let lastView = '';
  L.render = function (...args) {
    const main = document.getElementById('main');
    const nextView = viewKey();
    const changed = lastView !== '' && nextView !== lastView;
    main?.classList.remove('enter');
    const result = originalRender.apply(this, args);
    lastView = nextView;
    if (changed && L.motionOn() && main) {
      void main.offsetWidth;
      main.classList.add('enter');
    }
    return result;
  };

  const originalOpening = L.opening;
  L.opening = async function (...args) {
    await originalOpening.apply(this, args);
    const main = document.getElementById('main');
    if (L.motionOn() && main) {
      main.classList.remove('enter');
      void main.offsetWidth;
      main.classList.add('enter');
    }
  };

  const originalApplyPrefs = L.applyPrefs;
  let themeTimer = 0;
  L.applyPrefs = function (...args) {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    const result = originalApplyPrefs.apply(this, args);
    const next = root.dataset.theme;
    if (previous && previous !== next && L.motionOn()) {
      root.style.setProperty('--theme-cover', previous === 'dark' ? '#141416' : '#FFFFFF');
      root.classList.remove('theme-reveal-active');
      root.classList.add('theme-reveal');
      void root.offsetWidth;
      root.classList.add('theme-reveal-active');
      clearTimeout(themeTimer);
      themeTimer = setTimeout(() => {
        root.classList.remove('theme-reveal', 'theme-reveal-active');
        root.style.removeProperty('--theme-cover');
      }, 360);
    }
    return result;
  };
})(globalThis);
