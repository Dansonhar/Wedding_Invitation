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

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 50);
    camera.position.z = 8;

    // World-space bounds visible at z = 0
    const vFOV = (60 * Math.PI) / 180;
    const visH = 2 * Math.tan(vFOV / 2) * camera.position.z; // ~9.24 units
    const visW = visH * (W / H);

    // ── Geometries ──────────────────────────────────────────
    // Leaf: pointed oval
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo( 0.44,  0.08,  0.44, 0.92, 0, 1);
    leafShape.bezierCurveTo(-0.44,  0.92, -0.44, 0.08, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape, 10);

    // Petal: small ellipse
    const petalShape = new THREE.Shape();
    petalShape.absellipse(0, 0, 0.28, 0.16, 0, Math.PI * 2);
    const petalGeo = new THREE.ShapeGeometry(petalShape, 10);

    // Berry: tiny sphere
    const berryGeo = new THREE.SphereGeometry(0.09, 7, 7);

    // ── Materials ────────────────────────────────────────────
    const mkMat = (hex, opacity, double) => new THREE.MeshBasicMaterial({
      color: hex, transparent: true, opacity,
      side: double ? THREE.DoubleSide : THREE.FrontSide,
    });

    const leafMats  = [mkMat(0x789e6d, .86, true), mkMat(0x8fae7a, .78, true), mkMat(0x567a50, .80, true)];
    const petalMat  = mkMat(0xf5ddd6, .72, true);
    const berryMat  = mkMat(0xc67a7a, .92, false);

    // ── Particle pool ─────────────────────────────────────────
    const COUNT     = Math.max(40, Math.min(80, Math.floor((W * H) / 9000)));
    const pool      = [];

    function resetParticle(p, fromBottom) {
      const y = fromBottom
        ? -(visH / 2) - Math.random() * visH * 0.6
        : (Math.random() - 0.5) * visH;

      p.mesh.position.set(
        (Math.random() - 0.5) * visW * 1.3,
        y,
        (Math.random() - 0.5) * 2.5
      );
      p.mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      p.vy    = 0.02 + Math.random() * 0.032;
      p.phase = Math.random() * Math.PI * 2;
      p.amp   = 0.007 + Math.random() * 0.014;
      p.rx    = (Math.random() - 0.5) * 0.036;
      p.ry    = (Math.random() - 0.5) * 0.026;
      p.rz    = (Math.random() - 0.5) * 0.022;
      p.age   = 0;
    }

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random();
      let mesh;

      if (r < 0.50) {
        // Leaf
        const s = 0.16 + Math.random() * 0.26;
        mesh = new THREE.Mesh(leafGeo, leafMats[Math.floor(Math.random() * 3)]);
        mesh.scale.setScalar(s);
      } else if (r < 0.80) {
        // Petal
        const s = 0.55 + Math.random() * 0.5;
        mesh = new THREE.Mesh(petalGeo, petalMat);
        mesh.scale.setScalar(s);
      } else {
        // Berry
        const s = 0.5 + Math.random() * 0.5;
        mesh = new THREE.Mesh(berryGeo, berryMat);
        mesh.scale.setScalar(s);
      }

      scene.add(mesh);
      const p = { mesh, vy: 0, phase: 0, amp: 0, rx: 0, ry: 0, rz: 0, age: 0 };
      resetParticle(p, true);
      pool.push(p);
    }

    // ── Animation loop ────────────────────────────────────────
    let rafId;

    (function animate() {
      rafId = requestAnimationFrame(animate);

      pool.forEach((p) => {
        p.age++;
        p.mesh.position.y += p.vy;
        p.mesh.position.x += Math.sin(p.age * 0.038 + p.phase) * p.amp;
        p.mesh.rotation.x += p.rx;
        p.mesh.rotation.y += p.ry;
        p.mesh.rotation.z += p.rz;

        // Recycle particle when it leaves the top
        if (p.mesh.position.y > visH / 2 + 1.5) resetParticle(p, true);
      });

      renderer.render(scene, camera);
    })();

    // ── Resize ────────────────────────────────────────────────
    function onResize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // ── Cleanup function returned to caller ───────────────────
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
