/* =============================================================
   Adrian & Charlotte — Hunbei-style swipe wedding invitation
   Modules:
     1 · Swipe / wheel page navigation (7 full-screen pages)
     2 · Dot indicators
     3 · Countdown (10 Oct 2026, 18:30 local)
     4 · RSVP form
     5 · YouTube background music (two-flag pattern)
   ============================================================= */

(() => {
  'use strict';

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1 · Swipe / wheel page navigation ──────────────────── */
  const pager  = document.getElementById('pager');
  const pages  = Array.from(document.querySelectorAll('.page'));
  const dotsEl = document.getElementById('pagerDots');

  let current   = 0;
  let animating = false;

  function setActive(idx) {
    pages.forEach((p, i) => p.classList.toggle('is-active', i === idx));
    [...dotsEl.children].forEach((d, i) => d.classList.toggle('is-on', i === idx));
    // Feed the parallax layers — decor responds at slower speeds than the pager
    document.body.style.setProperty('--pi', idx);
  }

  function goTo(idx) {
    idx = Math.max(0, Math.min(pages.length - 1, idx));
    if (idx === current || animating) return;
    animating = true;
    current   = idx;
    pager.style.transform = `translateY(-${idx * 100}dvh)`;
    setActive(idx);
    // Unlock after transition completes (CSS is 900ms)
    setTimeout(() => { animating = false; }, 920);
  }

  // Build dots
  pages.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to page ${i + 1}`);
    if (i === 0) dot.classList.add('is-on');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  // Touch swipe
  let touchStartY = 0;
  let touchStartT = 0;
  let touchStartTarget = null;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartT = Date.now();
    touchStartTarget = e.target;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    // If the gesture started inside a scrollable frame content that
    // still has room to scroll, let the native scroll handle it.
    const dy  = touchStartY - e.changedTouches[0].clientY;
    const dt  = Date.now() - touchStartT;
    const abs = Math.abs(dy);
    if (abs < 40 || dt > 800) return;

    const scrollable = touchStartTarget && touchStartTarget.closest('.frame__content');
    if (scrollable) {
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const atTop    = scrollTop <= 1;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      // Only change page if user is swiping past the edge of the content
      if (dy > 0 && !atBottom) return; // wants next, but can still scroll down
      if (dy < 0 && !atTop)    return; // wants prev, but can still scroll up
    }

    if (dy > 0) goTo(current + 1);
    else        goTo(current - 1);
  }, { passive: true });

  // Wheel (desktop) — throttled
  let wheelLock = 0;
  window.addEventListener('wheel', (e) => {
    const now = Date.now();
    if (now - wheelLock < 950 || animating) return;
    if (Math.abs(e.deltaY) < 20) return;
    wheelLock = now;
    if (e.deltaY > 0) goTo(current + 1);
    else              goTo(current - 1);
  }, { passive: true });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault(); goTo(current + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault(); goTo(current - 1);
    }
  });

  /* ── 2 · Countdown ──────────────────────────────────────── */
  const TARGET = new Date(2026, 9, 10, 18, 30, 0); // 10 Oct 2026, 18:30
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
  const els = {
    d: document.getElementById('cdDays'),
    h: document.getElementById('cdHours'),
    m: document.getElementById('cdMinutes'),
    s: document.getElementById('cdSeconds'),
  };
  function tick() {
    let diff = Math.max(0, Math.floor((TARGET - Date.now()) / 1000));
    const D = Math.floor(diff / 86400); diff -= D * 86400;
    const H = Math.floor(diff / 3600);  diff -= H * 3600;
    const M = Math.floor(diff / 60);    diff -= M * 60;
    if (els.d) els.d.textContent = pad(D);
    if (els.h) els.h.textContent = pad(H);
    if (els.m) els.m.textContent = pad(M);
    if (els.s) els.s.textContent = pad(diff);
  }
  if (els.d) { tick(); setInterval(tick, 1000); }

  /* ── 3 · RSVP ───────────────────────────────────────────── */
  const form = document.getElementById('rsvpForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const side = form.side.value;
      const main = form.main.value;
      if (!name || !side || !main) {
        const miss = !name ? form.name : !side ? form.side : form.main;
        if (miss && miss.focus) miss.focus();
        return;
      }
      form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
      const ok = document.getElementById('rsvpSuccess');
      if (ok) ok.hidden = false;
    });
  }

  // Expose for the music module below
  window.__goTo = goTo;

  /* ── Letter-splitter: wraps each character of an element in a
     span with a --l index so CSS can stagger entrances.
     Applied to hero text (cover title + couple names) for the
     premium letter-by-letter reveal. ─────────────────────── */
  function splitLetters(el, startDelay = 0) {
    if (!el || el.dataset.split) return;
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    for (const ch of text) {
      if (ch === ' ') {
        el.appendChild(document.createTextNode(' '));
      } else {
        const s = document.createElement('span');
        s.className = 'ltr';
        s.style.setProperty('--l', i);
        s.style.setProperty('--l-start', startDelay + 'ms');
        s.textContent = ch;
        el.appendChild(s);
      }
      i++;
    }
    el.dataset.split = '1';
  }
  splitLetters(document.querySelector('.cover-title'), 200);
  // Split "Adrian Yeow" and "Charlotte Har" separately so the amp (&) stays intact
  document.querySelectorAll('.cover-names .name-part').forEach((el, idx) => {
    splitLetters(el, 900 + idx * 500);
  });
})();

/* ═══════════════════════════════════════════════════════
   4 · YouTube background music (two-flag pattern)
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const VIDEO_ID  = 'SuPCTBmISzQ';
  let   player    = null;
  let   playerReady = false;
  let   userActed   = false;
  let   isPlaying   = true;

  const btn = document.getElementById('musicBtn');
  function setPlayingClass(on) {
    if (btn) btn.classList.toggle('is-playing', on);
  }

  function tryUnmute() {
    if (player && playerReady) {
      try {
        player.unMute();
        player.setVolume(70);
      } catch (_) {}
    }
  }

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('ytPlayer', {
      videoId: VIDEO_ID,
      playerVars: {
        autoplay      : 1,
        mute          : 1,
        loop          : 1,
        playlist      : VIDEO_ID,
        controls      : 0,
        disablekb     : 1,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline   : 1,
        rel           : 0,
      },
      events: {
        onReady: function (e) {
          playerReady = true;
          e.target.playVideo();
          tryUnmute();
          setPlayingClass(true);
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) e.target.playVideo();
          if (e.data === YT.PlayerState.PLAYING) { isPlaying = true; setPlayingClass(true); }
          if (e.data === YT.PlayerState.PAUSED)  { isPlaying = false; setPlayingClass(false); }
        },
      },
    });
  };

  function onFirstInteraction() {
    if (userActed) return;
    userActed = true;
    tryUnmute();
    ['touchstart', 'mousedown', 'keydown'].forEach(evt => {
      document.removeEventListener(evt, onFirstInteraction);
    });
  }
  ['touchstart', 'mousedown', 'keydown'].forEach(evt => {
    document.addEventListener(evt, onFirstInteraction, { passive: true });
  });

  // Music toggle button
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!playerReady) return;
      if (isPlaying) { player.pauseVideo(); } else { player.playVideo(); }
    });
  }
}());
