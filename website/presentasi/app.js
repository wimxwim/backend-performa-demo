// presentasi/app.js — 40 slides navigation, keyboard, hash, progress, fullscreen, poster interaktif
(function () {
  const TOTAL = 40;
  let current = 1;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function clamp(n) { return Math.max(1, Math.min(TOTAL, n)); }

  function updateHash(n) {
    if (location.hash !== '#slide-' + n) history.replaceState(null, '', '#slide-' + n);
  }

  function updateProgress(n) {
    const pct = ((n / TOTAL) * 100).toFixed(2);
    const bar = $('#progress');
    if (bar) bar.style.width = pct + '%';
    const label = $('#progress-label');
    if (label) label.textContent = n + ' / ' + TOTAL + '  (' + Math.round((n / TOTAL) * 100) + '%)';
  }

  function updateNav(n) {
    const prev = $('#btn-prev'), next = $('#btn-next');
    if (prev) prev.disabled = n <= 1;
    if (next) next.disabled = n >= TOTAL;
    const counter = $('#slide-counter');
    if (counter) counter.textContent = n + ' / ' + TOTAL;
  }

  function showSlide(n) {
    n = clamp(n);
    current = n;
    $$('.slide').forEach((el) => el.classList.remove('active'));
    const target = $('#slide-' + n);
    if (target) {
      target.classList.add('active');
      // scroll top of slide container
      const scroller = $('#slide-viewport');
      if (scroller) scroller.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    updateHash(n);
    updateProgress(n);
    updateNav(n);
    // aria
    $$('.slide').forEach((el) => el.setAttribute('aria-hidden', el.id === 'slide-' + n ? 'false' : 'true'));
  }

  function nextSlide() { showSlide(current + 1); }
  function prevSlide() { showSlide(current - 1); }
  function goSlide(n) { showSlide(n); }

  function parseHash() {
    const m = location.hash.match(/#slide-(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n >= 1 && n <= TOTAL) return n;
    }
    return 1;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); nextSlide(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prevSlide(); }
    if (e.key === 'Home') { e.preventDefault(); showSlide(1); }
    if (e.key === 'End') { e.preventDefault(); showSlide(TOTAL); }
    if (e.key === 'f' || e.key === 'F') { if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleFullscreen(); } }
    if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    // number jump 1-9
    if (/^[1-9]$/.test(e.key) && (e.altKey || e.metaKey)) {
      const n = parseInt(e.key, 10);
      if (n <= TOTAL) { e.preventDefault(); showSlide(n); }
    }
  });

  // Hash change (back/forward)
  window.addEventListener('hashchange', () => showSlide(parseHash()));

  // Expose globals for onclick
  window.nextSlide = nextSlide;
  window.prevSlide = prevSlide;
  window.goSlide = goSlide;
  window.toggleFullscreen = toggleFullscreen;

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    // build dot grid for P99 slides if empty
    $$('[data-dot-grid]').forEach((el) => {
      if (el.children.length) return;
      for (let i = 0; i < 100; i++) {
        const d = document.createElement('div');
        d.className = 'dot ' + (i === 99 ? 'dot-red' : 'dot-green');
        d.title = i === 99 ? '1% tail — >P99 (paling lambat, paling vokal)' : '99% <= P99';
        d.setAttribute('aria-label', i === 99 ? 'tail latency' : 'within p99');
        el.appendChild(d);
      }
    });
    // hover ms table highlight
    $$('[data-ms-row]').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        const v = row.getAttribute('data-ms-row');
        $$('[data-ms-viz]').forEach((viz) => {
          viz.querySelectorAll('.viz-bar').forEach((b) => {
            b.style.opacity = b.getAttribute('data-tier') === v ? '1' : '0.25';
          });
        });
      });
      row.addEventListener('mouseleave', () => {
        $$('[data-ms-viz] .viz-bar').forEach((b) => (b.style.opacity = '1'));
      });
    });

    showSlide(parseHash());

    // touch swipe
    let startX = 0;
    const vp = $('#slide-viewport') || document.body;
    vp.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
    vp.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { if (dx < 0) nextSlide(); else prevSlide(); }
    }, { passive: true });
  });
})();
