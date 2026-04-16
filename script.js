/* =============================================================
   Alessandro & Isabella — Interactions
   - Scroll-reveal fade-ins via IntersectionObserver
   - Smooth scroll offset for the fixed nav
   - Nav auto-hide on downward scroll
   - RSVP form with elegant success state
   ============================================================= */

(() => {
  'use strict';

  /* ── 1. Scroll-reveal fade-ins ──────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger siblings slightly so groups cascade in
            const parent = entry.target.parentElement;
            const siblings = parent ? Array.from(parent.querySelectorAll('.reveal')) : [];
            const index = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = (index > -1 ? index * 90 : 0) + 'ms';
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    // Fallback: reveal everything immediately
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ── 2. Smooth scroll with fixed-nav offset ─────────────── */
  const nav = document.querySelector('.nav');
  const navHeight = () => (nav ? nav.offsetHeight : 0);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight() + 2;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── 3. Auto-hide nav on scroll down, show on scroll up ─── */
  let lastY = window.scrollY;
  let ticking = false;

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (nav) {
          // Only hide once past the hero
          if (y > 120 && y > lastY) nav.classList.add('is-hidden');
          else nav.classList.remove('is-hidden');
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    },
    { passive: true }
  );

  /* ── 4. RSVP form ───────────────────────────────────────── */
  const form = document.getElementById('rsvpForm');
  const success = document.getElementById('rsvpSuccess');
  const dietaryField = document.getElementById('dietaryDetailsField');
  const dietaryInput = document.getElementById('dietaryDetails');

  // Reveal "please specify" only when "Yes" is chosen for dietary
  if (form && dietaryField && dietaryInput) {
    form.querySelectorAll('input[name="dietary"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const needsDetails = e.target.value === 'yes';
        dietaryField.hidden = !needsDetails;
        dietaryInput.required = needsDetails;
        if (needsDetails) dietaryInput.focus();
        else dietaryInput.value = '';
      });
    });
  }

  if (form && success) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const get = (name) => form.querySelector(`input[name="${name}"]:checked`);

      const name = form.fullName.value.trim();
      const email = form.email.value.trim();
      const attending = get('attending');
      const affiliation = get('affiliation');
      const dietary = get('dietary');
      const dietaryDetailsNeeded = dietary && dietary.value === 'yes';
      const dietaryDetails = dietaryInput ? dietaryInput.value.trim() : '';

      // Find first missing field in order
      let firstMissing = null;
      if (!name) firstMissing = form.fullName;
      else if (!email) firstMissing = form.email;
      else if (!attending) firstMissing = form.querySelector('input[name="attending"]');
      else if (!affiliation) firstMissing = form.querySelector('input[name="affiliation"]');
      else if (!dietary) firstMissing = form.querySelector('input[name="dietary"]');
      else if (dietaryDetailsNeeded && !dietaryDetails) firstMissing = dietaryInput;

      if (firstMissing) {
        if (typeof firstMissing.focus === 'function') firstMissing.focus();
        if (typeof firstMissing.scrollIntoView === 'function') {
          firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // In a real deployment, submit to your server / service here.
      // For now, we simulate success with a graceful fade.
      form.querySelectorAll('input, select, textarea, button').forEach((el) => (el.disabled = true));

      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ── 5. Preserve transition delays only on first reveal ── */
  window.addEventListener('load', () => {
    // Clear inline delays after initial cascade so hover/state transitions are snappy.
    setTimeout(() => {
      reveals.forEach((el) => (el.style.transitionDelay = ''));
    }, 2000);
  });
})();
