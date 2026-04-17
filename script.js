/* =============================================================
   Ethan & Sophia — Mobile botanical e-card
   Modules:
     1 · Scroll reveal (fade + gentle rise)
     2 · Gentle parallax on botanical background
     3 · Countdown timer to 10 October 2026, 15:00 local
     4 · RSVP form handler
     5 · Thank You overlay
   ============================================================= */

(() => {
  'use strict';

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1 · Scroll reveal ──────────────────────────────────── */
  // Each .reveal element fades in + rises when it scrolls into view.
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    // No observer support — show everything immediately.
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ── 2 · Soft parallax for the botanical background ─────── */
  // The background layer drifts up slowly as you scroll, giving the
  // cards the feeling of floating over a painted page.
  const bg = document.getElementById('bg');
  if (bg && !prefersReducedMotion) {
    let targetY = 0;
    let currentY = 0;
    let rafId = null;

    function onScroll() {
      targetY = window.scrollY * -0.12; // -12% parallax coefficient
      if (!rafId) rafId = requestAnimationFrame(render);
    }
    function render() {
      // Ease toward the target for smoothness
      currentY += (targetY - currentY) * 0.12;
      if (Math.abs(targetY - currentY) < 0.1) currentY = targetY;
      bg.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0)`;
      rafId = Math.abs(targetY - currentY) > 0.1 ? requestAnimationFrame(render) : null;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3 · Countdown timer ────────────────────────────────── */
  // Target: 10 October 2026, 3:00 pm local time.
  const TARGET = new Date(2026, 9, 10, 15, 0, 0); // month is 0-indexed
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  const els = {
    d: document.getElementById('cdDays'),
    h: document.getElementById('cdHours'),
    m: document.getElementById('cdMinutes'),
    s: document.getElementById('cdSeconds'),
  };

  function tickCountdown() {
    const now = new Date();
    let diff = Math.max(0, Math.floor((TARGET - now) / 1000));
    const days  = Math.floor(diff / 86400); diff -= days * 86400;
    const hours = Math.floor(diff / 3600);  diff -= hours * 3600;
    const mins  = Math.floor(diff / 60);    diff -= mins * 60;
    const secs  = diff;
    if (els.d) els.d.textContent = pad(days);
    if (els.h) els.h.textContent = pad(hours);
    if (els.m) els.m.textContent = pad(mins);
    if (els.s) els.s.textContent = pad(secs);
  }

  if (els.d || els.h || els.m || els.s) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ── 4 · RSVP form ──────────────────────────────────────── */
  const form = document.getElementById('rsvpForm');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const side = form.side.value;

      let firstMissing = null;
      if (!name) firstMissing = form.name;
      else if (!side) firstMissing = form.side;

      if (firstMissing) {
        if (typeof firstMissing.focus === 'function') firstMissing.focus();
        if (typeof firstMissing.scrollIntoView === 'function') {
          firstMissing.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        }
        return;
      }

      // Disable form while overlay is shown.
      form.querySelectorAll('input, select, button').forEach((el) => (el.disabled = true));

      // Show botanical thank-you overlay.
      showThankYou(name);
    });
  }

  /* ── 5 · Thank You overlay ───────────────────────────────── */
  function showThankYou(guestName) {
    const overlay  = document.getElementById('tyOverlay');
    const nameEl   = document.getElementById('tyName');
    const closeBtn = document.getElementById('tyClose');
    if (!overlay) return;

    if (nameEl && guestName) nameEl.textContent = '— ' + guestName + ' —';

    // Activate overlay
    requestAnimationFrame(() => overlay.classList.add('is-active'));

    function close() {
      overlay.classList.remove('is-active');
    }

    closeBtn.addEventListener('click', close, { once: true });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); }, { once: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });
  }


})();
