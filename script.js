/* =============================================================
   Ethan & Sophia — Mobile botanical e-card
   Modules:
     1 · Scroll reveal (fade + gentle rise)
     2 · Gentle parallax on botanical background
     3 · Countdown timer to 10 October 2026, 15:00 local
     4 · RSVP form handler
     5 · Thank You overlay
     6 · Three.js botanical particle system
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
    const canvas   = document.getElementById('tyCanvas');
    if (!overlay) return;

    if (nameEl && guestName) nameEl.textContent = '— ' + guestName + ' —';

    // Activate overlay
    requestAnimationFrame(() => overlay.classList.add('is-active'));

    // Launch Three.js particles (skip if reduced-motion or Three unavailable)
    const stopParticles = (typeof THREE !== 'undefined' && !prefersReducedMotion)
      ? startBotanicalParticles(canvas)
      : () => {};

    function close() {
      overlay.classList.remove('is-active');
      overlay.addEventListener('transitionend', stopParticles, { once: true });
    }

    closeBtn.addEventListener('click', close, { once: true });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); }, { once: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });
  }

  /* ── 6 · Three.js botanical particle system ─────────────── */
  function startBotanicalParticles(canvas) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    // Orthographic camera: 1 world unit = 1 CSS pixel — exact, predictable sizing
    const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 10);
    cam.position.z = 5;

    // ── Geometries (sizes in pixels) ──────────────────────────
    // Leaf: slim diamond  ~10 × 20 px
    // Petal: wide diamond ~16 × 10 px
    // Berry: circle       ~7 px radius
    function makeDiamond(w, h) {
      const hw = w / 2, hh = h / 2;
      const pos = new Float32Array([
         0,  hh, 0,   // top
        hw,   0, 0,   // right
         0, -hh, 0,   // bottom
       -hw,   0, 0,   // left
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex([0, 1, 3,  1, 2, 3]);
      return geo;
    }

    const leafGeo  = makeDiamond(10, 20);
    const petalGeo = makeDiamond(16, 10);
    const berryGeo = new THREE.CircleGeometry(7, 10);

    // ── Materials ────────────────────────────────────────────
    const mkMat = (hex, opacity) => new THREE.MeshBasicMaterial({
      color: hex, transparent: true, opacity, side: THREE.DoubleSide,
    });
    const leafMats = [mkMat(0x789e6d, .82), mkMat(0x8fae7a, .74), mkMat(0x567a50, .78)];
    const petalMat = mkMat(0xf5ddd6, .68);
    const berryMat = mkMat(0xc67a7a, .88);

    // ── Particle pool ─────────────────────────────────────────
    const COUNT = Math.min(65, Math.max(35, Math.floor((W * H) / 8500)));
    const pool  = [];

    function resetParticle(p, spreadY) {
      p.mesh.position.x = (Math.random() - 0.5) * W * 1.15;
      p.mesh.position.y = spreadY
        ? (Math.random() - 0.5) * H
        : -H / 2 - 20 - Math.random() * 80;
      p.mesh.position.z = (Math.random() - 0.5) * 2;
      p.mesh.rotation.z = Math.random() * Math.PI * 2;
      p.mesh.rotation.x = (Math.random() - 0.5) * 1.2; // slight 3-D tilt
      p.vy    = 0.5 + Math.random() * 0.9;              // px / frame
      p.phase = Math.random() * Math.PI * 2;
      p.vrz   = (Math.random() - 0.5) * 0.04;
      p.age   = 0;
    }

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random();
      let mesh, scale;
      if (r < 0.50) {
        scale = 0.7 + Math.random() * 1.0;               // leaf  14–30 px tall
        mesh  = new THREE.Mesh(leafGeo, leafMats[Math.floor(Math.random() * 3)]);
      } else if (r < 0.80) {
        scale = 0.7 + Math.random() * 0.8;               // petal 7–14 px tall
        mesh  = new THREE.Mesh(petalGeo, petalMat);
      } else {
        scale = 0.6 + Math.random() * 0.7;               // berry 4–9 px radius
        mesh  = new THREE.Mesh(berryGeo, berryMat);
      }
      mesh.scale.setScalar(scale);
      scene.add(mesh);

      const p = { mesh, vy: 0, phase: 0, vrz: 0, age: 0 };
      resetParticle(p, true);   // seed: spread randomly across screen
      pool.push(p);
    }

    // ── Animation loop ────────────────────────────────────────
    let rafId;
    (function animate() {
      rafId = requestAnimationFrame(animate);
      pool.forEach((p) => {
        p.age++;
        p.mesh.position.y += p.vy;
        p.mesh.position.x += Math.sin(p.age * 0.03 + p.phase) * 0.45;
        p.mesh.rotation.z += p.vrz;
        if (p.mesh.position.y > H / 2 + 25) resetParticle(p, false);
      });
      renderer.render(scene, cam);
    })();

    // ── Resize ────────────────────────────────────────────────
    function onResize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      cam.left = -w / 2; cam.right = w / 2;
      cam.top  =  h / 2; cam.bottom = -h / 2;
      cam.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // ── Cleanup ───────────────────────────────────────────────
    return function stop() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      pool.forEach((p) => scene.remove(p.mesh));
      renderer.dispose();
      leafGeo.dispose(); petalGeo.dispose(); berryGeo.dispose();
      leafMats.forEach((m) => m.dispose());
      petalMat.dispose(); berryMat.dispose();
    };
  }

})();
