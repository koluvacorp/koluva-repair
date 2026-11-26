/* Koluva · apertura compartida. KoluvaIntro.play({iso, pattern, color, duration, skippable}) -> Promise */
(function (g) {
  'use strict';
  function gates(o) {
    const w = o.clientWidth, h = o.clientHeight, b = o.querySelector('.k-logo').getBoundingClientRect();
    const at = (x, y) => [b.left + x * b.width, b.top + y * b.height];
    const curve = (a, p, q, d, n = 14) => Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * p[0] + 3 * u * t * t * q[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * p[1] + 3 * u * t * t * q[1] + t * t * t * d[1]]; });
    const first = at(0, 1), last = at(1, 0);
    const line = [[0, h], ...curve([0, h], [w * .05, h * .91], [w * .14, h * .8], [w * .22, h * .84]), ...curve([w * .22, h * .84], [w * .34, h * .93], [w * .34, h * .7], first), last, ...curve(last, [w * .66, h * .34], [w * .84, h * .48], [w, 0])];
    const poly = pts => `polygon(${pts.map(([x, y]) => `${(x / w * 100).toFixed(3)}% ${(y / h * 100).toFixed(3)}%`).join(',')})`;
    o.querySelector('.k-gate-a').style.clipPath = poly([[0, 0], [w, 0], ...line.slice().reverse(), [0, h]]);
    const len = Math.hypot(w, h), cov = line.map(([x, y]) => [Math.max(0, x - h / len * 4), Math.max(0, y - w / len * 4)]);
    o.querySelector('.k-gate-b').style.clipPath = poly([[0, h], ...cov, [w, 0], [w, h]]);
  }
  g.KoluvaIntro = {
    play(opt) {
      return new Promise(resolve => {
        const o = document.createElement('div'); o.className = 'k-intro'; o.setAttribute('aria-hidden', 'true');
        if (opt.reducedMotion) o.classList.add('k-intro-reduced');
        o.style.setProperty("--k-pattern", `url("${new URL(opt.pattern, document.baseURI).href}")`); if (opt.color) o.style.setProperty('--k-bg', opt.color);
        const dur = opt.duration || 2000; o.style.setProperty('--k-dur', dur + 'ms');
        o.innerHTML = '<div class="k-gate k-gate-a"></div><div class="k-gate k-gate-b"></div><div class="k-logo"><img class="k-full" alt="" src="' + opt.iso + '"><span class="k-piece k-piece-a"><img alt="" src="' + opt.iso + '"></span><span class="k-piece k-piece-b"><img alt="" src="' + opt.iso + '"></span></div>';
        document.body.append(o); document.body.classList.add('k-intro-playing'); gates(o);
        let done = false, fade;
        const end = () => { if (done) return; done = true; document.removeEventListener('keydown', key, true); fade?.cancel(); o.remove(); document.body.classList.remove('k-intro-playing'); resolve(); };
        const key = e => { if (['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); end(); } };
        if (opt.skippable !== false) { o.addEventListener('click', end); document.addEventListener('keydown', key, true); }
        if (opt.reducedMotion && typeof o.animate === 'function') {
          requestAnimationFrame(() => {
            if (done) return;
            fade = o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: 'ease-out', fill: 'forwards' });
            fade.finished.then(end, () => {});
          });
        }
        setTimeout(end, dur + 80);
      });
    },
  };
})(window);
