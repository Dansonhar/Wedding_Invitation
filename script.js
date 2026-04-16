/* =============================================================
   Ethan & Sophia — Cinematic Vintage Wedding
   Sections:
     1 · Scroll-reveal fade-ins
     2 · Smooth scroll with fixed-nav offset
     3 · Nav auto-hide on scroll down
     4 · Countdown timer (target: 12 December 2026, 15:00)
     5 · Hero particles (gold light motes) on canvas
     6 · Music toggle (graceful when file is missing)
     7 · RSVP form with conditional dietary field
   ============================================================= */

(() => {
  'use strict';

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1 · Scroll-reveal fade-ins ─────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Stagger siblings slightly so groups cascade in
          const parent = entry.target.parentElement;
          const siblings = parent ? Array.from(parent.querySelectorAll('.reveal')) : [];
          const index = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = (index > -1 ? index * 90 : 0) + 'ms';
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ── 2 · Smooth scroll with fixed-nav offset ────────────── */
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
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ── 3 · Auto-hide nav on scroll down ───────────────────── */
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (nav) {
          if (y > 140 && y > lastY) nav.classList.add('is-hidden');
          else nav.classList.remove('is-hidden');
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    },
    { passive: true }
  );

  /* ── 4 · Countdown timer ────────────────────────────────── */
  // Target: 12 December 2026, 3:00 pm local time (ceremony start)
  const TARGET = new Date(2026, 11, 12, 15, 0, 0); // month is 0-indexed
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  const el = {
    d: document.getElementById('cdDays'),
    h: document.getElementById('cdHours'),
    m: document.getElementById('cdMinutes'),
    s: document.getElementById('cdSeconds'),
  };

  function tick() {
    const now = new Date();
    let diff = Math.max(0, Math.floor((TARGET - now) / 1000));
    const days = Math.floor(diff / 86400); diff -= days * 86400;
    const hours = Math.floor(diff / 3600);  diff -= hours * 3600;
    const mins  = Math.floor(diff / 60);    diff -= mins * 60;
    const secs  = diff;
    if (el.d) el.d.textContent = pad(days);
    if (el.h) el.h.textContent = pad(hours);
    if (el.m) el.m.textContent = pad(mins);
    if (el.s) el.s.textContent = pad(secs);
  }
  tick();
  setInterval(tick, 1000);

  /* ── 5 · Hero particles (golden light motes) ─────────────── */
  const canvas = document.getElementById('heroParticles');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1;
    let particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const hero = canvas.parentElement;
      w = hero.offsetWidth;
      h = hero.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Rebuild particle count based on area
      const count = Math.min(50, Math.max(18, Math.round((w * h) / 32000)));
      particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function makeParticle(initial = false) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 10,
        r: Math.random() * 2.2 + 0.6,     // radius
        vx: (Math.random() - 0.5) * 0.25,  // gentle horizontal drift
        vy: -(Math.random() * 0.35 + 0.15), // drift upward
        a: Math.random() * 0.55 + 0.15,   // alpha
        twinkle: Math.random() * Math.PI * 2,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.03;
        const a = p.a * (0.75 + Math.sin(p.twinkle) * 0.25);

        // Soft gold glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grad.addColorStop(0, `rgba(248, 232, 178, ${a})`);
        grad.addColorStop(0.4, `rgba(201, 169, 97, ${a * 0.4})`);
        grad.addColorStop(1, 'rgba(201, 169, 97, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Bright centre
        ctx.fillStyle = `rgba(255, 242, 210, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Recycle offscreen
        if (p.y + p.r < -10 || p.x < -20 || p.x > w + 20) {
          Object.assign(p, makeParticle(false));
        }
      }
      animId = requestAnimationFrame(draw);
    }

    let animId = null;
    resize();
    draw();

    // Debounced resize
    let rz;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(resize, 200);
    });

    // Pause when hero leaves viewport (save CPU)
    if ('IntersectionObserver' in window) {
      const heroObs = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !animId) draw();
          else if (!en.isIntersecting && animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        });
      }, { threshold: 0.01 });
      heroObs.observe(canvas.parentElement);
    }
  }

  /* ── 6 · Music toggle ───────────────────────────────────── */
  const musicBtn = document.getElementById('musicToggle');
  const audio = document.getElementById('bgMusic');

  if (musicBtn && audio) {
    audio.volume = 0.35;

    const setState = (playing) => {
      musicBtn.classList.toggle('is-playing', playing);
      musicBtn.setAttribute('aria-pressed', String(playing));
      musicBtn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    };

    musicBtn.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          await audio.play();
          setState(true);
        } else {
          audio.pause();
          setState(false);
        }
      } catch (err) {
        // File missing or autoplay blocked — stay silent
        setState(false);
        musicBtn.title = 'Music file not available';
      }
    });

    audio.addEventListener('ended', () => setState(false));
    audio.addEventListener('pause', () => setState(false));
    audio.addEventListener('play',  () => setState(true));
  }

  /* ── 7 · RSVP form ──────────────────────────────────────── */
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

      const pick = (name) => form.querySelector(`input[name="${name}"]:checked`);

      const name = form.fullName.value.trim();
      const email = form.email.value.trim();
      const attending = pick('attending');
      const affiliation = pick('affiliation');
      const dietary = pick('dietary');
      const dietaryDetailsNeeded = dietary && dietary.value === 'yes';
      const dietaryDetails = dietaryInput ? dietaryInput.value.trim() : '';

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
          firstMissing.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        }
        return;
      }

      // In production, POST to your server / Google Sheet / email endpoint here.
      form.querySelectorAll('input, select, textarea, button').forEach((el) => (el.disabled = true));
      success.hidden = false;
      success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ── 8 · Clear initial reveal delays after first cascade ── */
  window.addEventListener('load', () => {
    setTimeout(() => reveals.forEach((el) => (el.style.transitionDelay = '')), 2200);
  });
})();
