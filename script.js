'use strict';

/* ════════════════════════════════════════════════════════════════
   AXIOM — script.js
   Premium 3D Print Studio — Amsterdam
════════════════════════════════════════════════════════════════ */

/* ── Global state ────────────────────────────────────────────── */
const state = {
  mouse: { x: 0, y: 0, nx: 0, ny: 0 },
  scroll: 0,
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

window.addEventListener('mousemove', e => {
  state.mouse.x  = e.clientX;
  state.mouse.y  = e.clientY;
  state.mouse.nx = (e.clientX / window.innerWidth)  * 2 - 1;
  state.mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

window.addEventListener('scroll', () => {
  state.scroll = window.scrollY;
}, { passive: true });

/* ── Entry: wait for everything ─────────────────────────────── */
window.addEventListener('load', initLoader);


/* ════════════════════════════════════════════════════════════════
   LOADER
════════════════════════════════════════════════════════════════ */
function initLoader() {
  const loader   = document.getElementById('loader');
  const progress = document.getElementById('loader-progress');
  if (!loader) { initAll(); return; }

  let pct = 0;
  const interval = setInterval(() => {
    pct += Math.random() * 14 + 6;
    if (pct > 100) pct = 100;
    progress.style.width = pct + '%';

    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.remove('loading');
        setTimeout(initAll, 100);
      }, 400);
    }
  }, 100);
}

function initAll() {
  try { if (typeof gsap !== 'undefined') gsap.registerPlugin(ScrollTrigger, TextPlugin); } catch(e) {}

  initNav();
  initMobileNav();
  initHeroCanvas();
  initTransformCanvas();
  initGalleryCanvas();
  initProcess();
  initTerminal();
  initLiveFeed();
  initTiltCards();
  initReveal();
  initCounters();
  initContactForm();
  initBackToTop();
  initMatBars();
  initGlobe();
  initSkylineHover();
  initHeroStats();
}


/* ════════════════════════════════════════════════════════════════
   NAV
════════════════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  function update() {
    const heroH = document.getElementById('hero')?.offsetHeight ?? 600;
    nav.classList.toggle('scrolled', window.scrollY > heroH * 0.15);

    // Active link spy
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    nav.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();

  // Smooth scroll for nav anchors
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = nav.offsetHeight;
    const top  = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}


/* ════════════════════════════════════════════════════════════════
   MOBILE NAV
════════════════════════════════════════════════════════════════ */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('mobile-nav-overlay');
  const closeBtn  = document.getElementById('mobile-nav-close');

  function open()  { overlay.classList.add('open');  overlay.setAttribute('aria-hidden','false'); hamburger.classList.add('open');  hamburger.setAttribute('aria-expanded','true');  document.body.style.overflow='hidden'; }
  function close() { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true');  hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }

  hamburger?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}


/* ════════════════════════════════════════════════════════════════
   HERO CANVAS — Three.js particle field
════════════════════════════════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W(), H());

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 1000);
  camera.position.set(0, 0, 8);

  /* — Particles — */
  const COUNT = state.reduced ? 1000 : 2500;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);

  const C1 = new THREE.Color('#00d4ff');
  const C2 = new THREE.Color('#a855f7');
  const C3 = new THREE.Color('#ff0080');

  for (let i = 0; i < COUNT; i++) {
    // Distribute in a large sphere + some random scatter
    const r = 5 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Color gradient
    const t = Math.random();
    const col = t < 0.5
      ? C1.clone().lerp(C2, t * 2)
      : C2.clone().lerp(C3, (t - 0.5) * 2);
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    sizes[i] = Math.random() * 2 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  /* — Inner ring — */
  const ringGeo = new THREE.TorusGeometry(3, 0.008, 8, 120);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#00d4ff'),
    transparent: true, opacity: 0.15
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 4;
  scene.add(ring);

  const ring2 = ring.clone();
  ring2.rotation.x = -Math.PI / 3;
  ring2.rotation.y = Math.PI / 5;
  ring2.material = ringMat.clone();
  ring2.material.color = new THREE.Color('#a855f7');
  scene.add(ring2);

  /* — Animate — */
  let frame = 0;
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  function tick() {
    if (!document.hidden) {
      frame++;
      targetRotY = frame * 0.001 + state.mouse.nx * 0.4;
      targetRotX = frame * 0.0005 + state.mouse.ny * 0.25;
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      particles.rotation.x = currentRotX;
      particles.rotation.y = currentRotY;
      ring.rotation.z  = frame * 0.003;
      ring2.rotation.z = -frame * 0.002;

      // Fade particles with scroll
      const heroH = document.getElementById('hero')?.offsetHeight || H();
      mat.opacity = Math.max(0, 0.75 - (state.scroll / heroH) * 1.2);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  }
  tick();

  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
}


/* ════════════════════════════════════════════════════════════════
   HERO STATS — animated counters on load
════════════════════════════════════════════════════════════════ */
function initHeroStats() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}


/* ════════════════════════════════════════════════════════════════
   TRANSFORM CANVAS — Scroll-driven wireframe→solid
════════════════════════════════════════════════════════════════ */
function initTransformCanvas() {
  const canvas  = document.getElementById('transform-canvas');
  const section = document.getElementById('transform');
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* — Generate Fibonacci sphere points — */
  const N = 180;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const spherePts = [];

  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = GOLDEN * i;
    spherePts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }

  /* — Random scatter targets — */
  const scatterPts = spherePts.map(() => ({
    x: (Math.random() - 0.5) * 3,
    y: (Math.random() - 0.5) * 3,
    z: (Math.random() - 0.5) * 3
  }));

  /* — Cube target points — */
  const cubePts = [];
  const cubeN = N;
  for (let i = 0; i < cubeN; i++) {
    const face = i % 6;
    const u = (Math.random() - 0.5) * 2;
    const v = (Math.random() - 0.5) * 2;
    if (face === 0) cubePts.push({ x: u, y: v, z: 1 });
    else if (face === 1) cubePts.push({ x: u, y: v, z: -1 });
    else if (face === 2) cubePts.push({ x: 1, y: u, z: v });
    else if (face === 3) cubePts.push({ x: -1, y: u, z: v });
    else if (face === 4) cubePts.push({ x: u, y: 1, z: v });
    else cubePts.push({ x: u, y: -1, z: v });
  }

  /* — Projection helper — */
  function project(pt, rotY, fov) {
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const rx = pt.x * cosY - pt.z * sinY;
    const rz = pt.x * sinY + pt.z * cosY;
    const ry = pt.y;
    const scale = fov / (fov + rz * 120 + 300);
    return {
      px: W / 2 + rx * scale * 200,
      py: H / 2 + ry * scale * 200,
      scale,
      depth: rz
    };
  }

  /* — Lerp — */
  const lerp = (a, b, t) => a + (b - a) * t;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /* — Scroll progress — */
  function getProgress() {
    const rect  = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(1, -rect.top / total));
  }

  /* — Panel visibility — */
  const panels = {
    p1: document.getElementById('tp-1'),
    p2: document.getElementById('tp-2'),
    p3: document.getElementById('tp-3'),
  };
  const stats = {
    s1: document.getElementById('tps-1'),
    s2: document.getElementById('tps-2'),
    s3: document.getElementById('tps-3'),
  };

  function updatePanels(p) {
    const show = (el, v) => { if (el) el.classList.toggle('active', v); };
    show(panels.p1, p < 0.35);
    show(panels.p2, p >= 0.35 && p < 0.68);
    show(panels.p3, p >= 0.68);
    show(stats.s1, p < 0.35);
    show(stats.s2, p >= 0.35 && p < 0.68);
    show(stats.s3, p >= 0.68);
  }

  let rotY = 0;
  let animFrame;

  function draw() {
    animFrame = requestAnimationFrame(draw);
    if (document.hidden) return;

    rotY += 0.008;
    const progress = getProgress();
    updatePanels(progress);

    ctx.clearRect(0, 0, W, H);

    if (progress < 0.33) {
      /* ─ Phase 1: Wireframe Sphere ─ */
      drawWireframeSphere(spherePts, rotY, 1);

    } else if (progress < 0.66) {
      /* ─ Phase 2: Particles scatter ─ */
      const t = easeInOut((progress - 0.33) / 0.33);
      // Crossfade: wireframe fades out while particles fade in
      const wireAlpha = Math.max(0, 1 - t * 6);
      if (wireAlpha > 0) drawWireframeSphere(spherePts, rotY, wireAlpha);
      const pts = spherePts.map((sp, i) => ({
        x: lerp(sp.x, scatterPts[i].x, Math.min(t * 1.5, 1)),
        y: lerp(sp.y, scatterPts[i].y, Math.min(t * 1.5, 1)),
        z: lerp(sp.z, scatterPts[i].z, Math.min(t * 1.5, 1))
      }));
      drawParticles(pts, rotY, Math.min(1, t * 4));

    } else {
      /* ─ Phase 3: Solid cube assembles ─ */
      const t = easeInOut((progress - 0.66) / 0.34);
      const pts = spherePts.map((sp, i) => ({
        x: lerp(scatterPts[i].x, cubePts[i].x, t),
        y: lerp(scatterPts[i].y, cubePts[i].y, t),
        z: lerp(scatterPts[i].z, cubePts[i].z, t)
      }));
      drawParticles(pts, rotY, 1, t);
      if (t > 0.7) drawCubeWireframe(rotY, (t - 0.7) / 0.3);
    }
  }

  function drawWireframeSphere(pts, rotY, alpha) {
    // Connections between nearby points
    ctx.save();
    for (let i = 0; i < pts.length; i++) {
      const pi = project(pts[i], rotY, 600);
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dz = pts[i].z - pts[j].z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist > 0.45) continue;
        const pj = project(pts[j], rotY, 600);
        const edgeAlpha = (1 - dist / 0.45) * alpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(pi.px, pi.py);
        ctx.lineTo(pj.px, pj.py);
        ctx.strokeStyle = `rgba(255,215,0,${edgeAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Dots
    for (let i = 0; i < pts.length; i++) {
      const p = project(pts[i], rotY, 600);
      const r = Math.max(2, p.scale * 7);
      ctx.beginPath();
      ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${alpha * 0.9})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles(pts, rotY, alpha, solidT = 0) {
    ctx.save();
    for (let i = 0; i < pts.length; i++) {
      const p = project(pts[i], rotY, 600);
      const r = Math.max(2, p.scale * 9);

      // Color: gold → amber gradient
      const t = (pts[i].y + 1) / 2;
      let color;
      if (solidT > 0.5) {
        const brightness = Math.max(0.3, p.scale * 0.8);
        const rv = Math.round(lerp(245, 255, t) * brightness);
        const gv = Math.round(lerp(158, 215, t) * brightness);
        const bv = Math.round(lerp(11, 0, t) * brightness);
        color = `rgba(${rv},${gv},${bv},${alpha})`;
      } else {
        const ri = Math.round(lerp(245, 255, t));
        const gi = Math.round(lerp(158, 215, t));
        const bi = Math.round(lerp(11, 0, t));
        color = `rgba(${ri},${gi},${bi},${alpha * 0.9})`;
      }

      // Outer glow
      ctx.beginPath();
      ctx.arc(p.px, p.py, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${alpha * 0.06})`;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Extra glow assembling into solid
      if (solidT > 0.4) {
        ctx.beginPath();
        ctx.arc(p.px, p.py, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,0,${(solidT - 0.4) * 0.08})`;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCubeWireframe(rotY, alpha) {
    const size = 1;
    const corners = [
      [-size,-size,-size],[size,-size,-size],[size,size,-size],[-size,size,-size],
      [-size,-size, size],[size,-size, size],[size,size, size],[-size,size, size]
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];

    const projected = corners.map(([x,y,z]) => {
      return project({x, y, z}, rotY, 600);
    });

    ctx.save();
    ctx.strokeStyle = `rgba(255,215,0,${alpha * 0.6})`;
    ctx.lineWidth = 1.5;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(projected[a].px, projected[a].py);
      ctx.lineTo(projected[b].px, projected[b].py);
      ctx.stroke();
    });
    ctx.restore();
  }

  draw();
}


/* ════════════════════════════════════════════════════════════════
   GALLERY CANVAS — Three.js rotating 3D objects
════════════════════════════════════════════════════════════════ */
function initGalleryCanvas() {
  const canvas = document.getElementById('gallery-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const arena = canvas.parentElement;
  let W = arena ? arena.clientWidth  : (canvas.clientWidth  || 800);
  let H = arena ? arena.clientHeight : (canvas.clientHeight || 520);
  if (W < 10) W = 800;
  if (H < 10) H = 480;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.set(0, 0, 5);

  /* — Lights — */
  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);

  const mainLight = new THREE.PointLight(0x00d4ff, 2, 20);
  mainLight.position.set(3, 3, 3);
  scene.add(mainLight);

  const fillLight = new THREE.PointLight(0xa855f7, 1.5, 15);
  fillLight.position.set(-3, -1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xff0080, 1, 12);
  rimLight.position.set(0, -3, -2);
  scene.add(rimLight);

  /* — Model configs — */
  const models = [
    {
      name: 'Parametric Shell — Type A',
      mat: 'Resin HD', layer: '25μm', time: '4h 22m',
      create: () => {
        const g = new THREE.IcosahedronGeometry(1.4, 4);
        // Displace vertices
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const noise = Math.sin(x * 3) * Math.cos(y * 3) * Math.sin(z * 3) * 0.12;
          const len = Math.sqrt(x*x+y*y+z*z);
          pos.setXYZ(i, x/len*(1.4+noise), y/len*(1.4+noise), z/len*(1.4+noise));
        }
        g.computeVertexNormals();
        const m = new THREE.MeshPhongMaterial({ color: 0x00d4ff, wireframe: false, shininess: 120, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
        const wm = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.2 });
        const mesh = new THREE.Mesh(g, m);
        const wire = new THREE.Mesh(g, wm);
        const group = new THREE.Group();
        group.add(mesh, wire);
        return group;
      }
    },
    {
      name: 'Dragon Miniature — Scale 1:12',
      mat: 'Resin SLA', layer: '25μm', time: '3h 08m',
      create: () => {
        const g = new THREE.TorusKnotGeometry(0.9, 0.32, 140, 20, 2, 3);
        const m = new THREE.MeshPhongMaterial({ color: 0xa855f7, shininess: 160, transparent: true, opacity: 0.9 });
        const wm = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.18 });
        const mesh = new THREE.Mesh(g, m);
        const wire = new THREE.Mesh(g, wm);
        const group = new THREE.Group();
        group.add(mesh, wire);
        return group;
      }
    },
    {
      name: 'Aerospace Prototype — v7',
      mat: 'Nylon PA12', layer: '100μm', time: '6h 45m',
      create: () => {
        const g = new THREE.OctahedronGeometry(1.4, 2);
        const m = new THREE.MeshPhongMaterial({ color: 0xff0080, shininess: 200, transparent: true, opacity: 0.85 });
        const wm = new THREE.MeshBasicMaterial({ color: 0xff0080, wireframe: true, transparent: true, opacity: 0.25 });
        const mesh = new THREE.Mesh(g, m);
        const wire = new THREE.Mesh(g, wm);
        const group = new THREE.Group();
        group.add(mesh, wire);
        return group;
      }
    },
    {
      name: 'Industrial Gear — Type HX',
      mat: 'Metal PLA', layer: '150μm', time: '2h 15m',
      create: () => {
        // Lathe-based gear-like shape
        const pts = [];
        for (let i = 0; i <= 20; i++) {
          const t  = i / 20;
          const y  = t * 2.8 - 1.4;
          const r  = 1.1 + Math.sin(t * Math.PI) * 0.4;
          pts.push(new THREE.Vector2(r, y));
        }
        const g = new THREE.LatheGeometry(pts, 20);
        const m = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 250, transparent: true, opacity: 0.88 });
        const wm = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.2 });
        const mesh = new THREE.Mesh(g, m);
        const wire = new THREE.Mesh(g, wm);
        const group = new THREE.Group();
        group.add(mesh, wire);
        return group;
      }
    }
  ];

  const infos = [
    { name: 'Parametric Shell — Type A',   mat: 'Resin HD',   layer: '25μm',  time: '4h 22m' },
    { name: 'Dragon Miniature — Scale 1:12', mat: 'Resin SLA',  layer: '25μm',  time: '3h 08m' },
    { name: 'Aerospace Prototype — v7',    mat: 'Nylon PA12', layer: '100μm', time: '6h 45m' },
    { name: 'Industrial Gear — Type HX',   mat: 'Metal PLA',  layer: '150μm', time: '2h 15m' },
  ];

  let currentModel = 0;
  let currentMesh = null;

  function loadModel(idx) {
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh = null;
    }
    currentMesh = models[idx].create();
    scene.add(currentMesh);

    // Update info panel
    const info = infos[idx];
    const n = document.getElementById('gi-name');
    const m = document.getElementById('gi-mat');
    const l = document.getElementById('gi-layer');
    const t = document.getElementById('gi-time');
    if (n) n.textContent = info.name;
    if (m) m.textContent = info.mat;
    if (l) l.textContent = info.layer;
    if (t) t.textContent = info.time;

    // Update light color
    const colors = [0x00d4ff, 0xa855f7, 0xff0080, 0xffd700];
    mainLight.color.set(colors[idx]);
    fillLight.color.set(colors[(idx + 1) % 4]);
  }

  loadModel(0);

  // Gallery buttons
  document.querySelectorAll('.gal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gal-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentModel = parseInt(btn.dataset.model);
      loadModel(currentModel);
      // Reset rotation
      autoRotX = 0; autoRotY = 0;
      dragRotX = 0; dragRotY = 0;
    });
  });

  /* — Drag rotation — */
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let dragRotX = 0, dragRotY = 0;
  let autoRotX = 0, autoRotY = 0;
  let velX = 0, velY = 0;

  canvas.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
  canvas.addEventListener('touchstart', e => { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: true });

  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    velX = dy * 0.005;
    velY = dx * 0.005;
    dragRotX += velX;
    dragRotY += velY;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    dragRotX += dy * 0.005;
    dragRotY += dx * 0.005;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }, { passive: true });

  /* — Mouse hover lighting — */
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width  * 2 - 1;
    const my = (e.clientY - rect.top)  / rect.height * 2 - 1;
    mainLight.position.x = mx * 4;
    mainLight.position.y = -my * 4;
    mainLight.intensity = 2.5;
  });

  canvas.addEventListener('mouseleave', () => {
    mainLight.position.set(3, 3, 3);
    mainLight.intensity = 2;
  });

  /* — Render loop — */
  let frame = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    frame++;

    if (!isDragging) {
      autoRotY += 0.005;
      velX *= 0.9; velY *= 0.9;
      dragRotX += velX; dragRotY += velY;
    }

    if (currentMesh) {
      currentMesh.rotation.x = dragRotX + autoRotX;
      currentMesh.rotation.y = dragRotY + autoRotY;
    }

    renderer.render(scene, camera);
  }
  tick();

  /* — Resize — */
  const ro = new ResizeObserver(() => {
    const nw = arena ? arena.clientWidth  : canvas.clientWidth;
    const nh = arena ? arena.clientHeight : canvas.clientHeight;
    if (nw > 10 && nh > 10) {
      W = nw; H = nh;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
  });
  ro.observe(arena || canvas);
}


/* ════════════════════════════════════════════════════════════════
   PROCESS — scroll-activated steps
════════════════════════════════════════════════════════════════ */
function initProcess() {
  const steps = document.querySelectorAll('.process-step');
  const line  = document.getElementById('process-line');
  if (!steps.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('activated');
    });
  }, { threshold: 0.3 });

  steps.forEach(s => obs.observe(s));

  // Animate the vertical line with scroll
  function updateLine() {
    if (!line) return;
    const track = line.parentElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
    const fill = line.querySelector('::after') || line;
    line.style.setProperty('--fill', (pct * 100) + '%');
    line.style.background = `linear-gradient(to bottom, #00d4ff 0%, #a855f7 ${pct*60}%, transparent ${pct*100}%)`;
    line.style.height = (pct * 100) + '%';
  }

  window.addEventListener('scroll', updateLine, { passive: true });
  updateLine();
}


/* ════════════════════════════════════════════════════════════════
   AI TERMINAL
════════════════════════════════════════════════════════════════ */
function initTerminal() {
  const input    = document.getElementById('terminal-input');
  const submit   = document.getElementById('ti-submit');
  const output   = document.getElementById('terminal-output');
  const panel    = document.getElementById('ai-result-panel');
  const arpTime  = document.getElementById('arp-time');
  const arpMat   = document.getElementById('arp-material');
  const arpRes   = document.getElementById('arp-resolution');
  const arpPrice = document.getElementById('arp-price');
  const arpLabel = document.getElementById('arp-label');
  const arpId    = document.getElementById('arp-id');
  const arpCta   = document.getElementById('arp-cta');
  const arpCnv   = document.getElementById('arp-canvas');
  if (!input) return;

  /* — AI response database — */
  const responses = [
    { k: ['dragon','draak'], time:'7h 43m', mat:'Resin HD', res:'50μm', price:'€ 149', label:'Fantasy Dragon — Drinking Coffee' },
    { k: ['canal','house','gracht','grachtenpand'], time:'11h 20m', mat:'Multicolor PLA', res:'100μm', price:'€ 219', label:'Amsterdam Canal House — 1:100' },
    { k: ['drone','frame','fpv'], time:'4h 15m', mat:'Carbon CF', res:'200μm', price:'€ 89', label:'FPV Race Drone Frame' },
    { k: ['skull','hoofd'], time:'6h 30m', mat:'Resin SLA', res:'25μm', price:'€ 129', label:'Human Skull — LED Housing' },
    { k: ['ring','jewelry','sieraad'], time:'2h 45m', mat:'Castable Resin', res:'25μm', price:'€ 79', label:'Custom Lattice Ring' },
    { k: ['gear','tandwiel','watch','horloge'], time:'1h 12m', mat:'Nylon PA12', res:'50μm', price:'€ 39', label:'Precision Watch Gear — 0.2mm teeth' },
    { k: ['moon','maan','lamp'], time:'8h 00m', mat:'Translucent PLA', res:'100μm', price:'€ 99', label:'Moon Lamp — NASA Elevation Data' },
    { k: ['guitar','gitaar'], time:'32h 00m', mat:'Carbon CF + PLA', res:'200μm', price:'€ 499', label:'Playable Guitar Body' },
    { k: ['house','home','huis'], time:'18h 30m', mat:'Multicolor Resin', res:'50μm', price:'€ 389', label:'Architectural Replica — Custom Scale' },
  ];

  function getResponse(query) {
    const q = query.toLowerCase();
    for (const r of responses) {
      if (r.k.some(k => q.includes(k))) return r;
    }
    // Random fallback
    const fallbacks = [
      { time:'5h 20m', mat:'Resin HD', res:'50μm', price:'€ 119', label: query.slice(0,40) + '...' },
      { time:'3h 45m', mat:'PLA Carbon', res:'100μm', price:'€ 79', label: query.slice(0,40) + '...' },
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function addLine(text, cls = 'to-dim', delay = 0) {
    return new Promise(res => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'to-line ' + cls;
        div.textContent = text;
        output.appendChild(div);
        output.scrollTop = output.scrollHeight;
        res();
      }, delay);
    });
  }

  async function runQuery(query) {
    if (!query.trim()) return;

    // Clear result panel
    panel?.classList.remove('active');
    if (arpCta) arpCta.style.display = 'none';

    // Show input in terminal
    await addLine('> ' + query, 'to-input');
    await sleep(200);
    await addLine('PROCESSING REQUEST...', 'to-ai');
    await sleep(400);

    const steps = [
      'PARSING NATURAL LANGUAGE INPUT',
      'RUNNING GEOMETRY SYNTHESIS ENGINE',
      'CALCULATING SUPPORT STRUCTURES',
      'OPTIMIZING LAYER PATHS',
      'SELECTING OPTIMAL MATERIAL',
      'GENERATING PRICE ESTIMATE',
    ];

    for (let i = 0; i < steps.length; i++) {
      await addLine('  [' + ('█'.repeat(i+1)) + ('░'.repeat(5-i)) + '] ' + steps[i], 'to-dim');
      await sleep(Math.random() * 120 + 60);
    }

    await sleep(200);
    const resp = getResponse(query);
    await addLine('─'.repeat(40), 'to-dim');
    await addLine('ESTIMATE READY ✦', 'to-success');

    // Update result panel
    if (arpTime)  arpTime.textContent  = resp.time;
    if (arpMat)   arpMat.textContent   = resp.mat;
    if (arpRes)   arpRes.textContent   = resp.res;
    if (arpPrice) arpPrice.textContent = resp.price;
    if (arpLabel) arpLabel.textContent = resp.label;
    if (arpId)    arpId.textContent    = '#AX-' + Math.floor(Math.random() * 900000 + 100000);
    if (panel)    panel.classList.add('active');
    if (arpCta)   arpCta.style.display = 'block';

    // Animate the result visual canvas
    animateResultCanvas(arpCnv, resp.price);

    await addLine('─'.repeat(40), 'to-dim');
  }

  function handleSubmit() {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    runQuery(q);
  }

  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });
  submit?.addEventListener('click', handleSubmit);

  // AI chips
  document.getElementById('ai-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.ai-chip');
    if (!chip) return;
    input.value = chip.dataset.query;
    handleSubmit();
  });
}

/* — Result canvas animation — */
function animateResultCanvas(canvas, price) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = canvas.clientWidth  || 400;
  let H = canvas.height = canvas.clientHeight || 200;

  const pts = [];
  for (let i = 0; i < 60; i++) {
    pts.push({
      x: Math.random() * W * 2 - W * 0.5,
      y: Math.random() * H * 2 - H * 0.5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5
    });
  }

  let frame = 0;
  let animId;

  function draw() {
    animId = requestAnimationFrame(draw);
    if (document.hidden) return;
    frame++;

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(168,85,247,0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // Floating particles
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168,85,247,0.6)';
      ctx.fill();
    });

    // Connecting lines
    for (let i = 0; i < pts.length; i++) {
      for (let j = i+1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d  = Math.sqrt(dx*dx+dy*dy);
        if (d > 80) continue;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(255,215,0,${0.15 * (1 - d/80)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Spinning hexagon
    const cx = W/2, cy = H/2, r = Math.min(W,H) * 0.25;
    const angle = frame * 0.02;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = angle + (i * Math.PI * 2) / 6;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (animId) cancelAnimationFrame(animId);
  draw();
}


/* ════════════════════════════════════════════════════════════════
   LIVE FEED
════════════════════════════════════════════════════════════════ */
function initLiveFeed() {
  const container = document.getElementById('lf-items');
  if (!container) return;

  const items = [
    { emoji:'🐉', title:'Dragon Skull — 1:1', meta:'Amsterdam · Resin HD · 7h 43m', status:'printing' },
    { emoji:'🏠', title:'Canal House Model', meta:'Rotterdam · Multicolor PLA · Done', status:'done' },
    { emoji:'💍', title:'Lattice Ring Collection', meta:'Amsterdam · Castable Resin', status:'shipped' },
    { emoji:'⚙️', title:'Turbine Housing v3', meta:'Utrecht · Nylon PA12 · 6h 45m', status:'printing' },
    { emoji:'🌙', title:'Moon Lamp — XL', meta:'Den Haag · Translucent PLA', status:'done' },
    { emoji:'🧠', title:'Brain Scan Model', meta:'Leiden · Resin SLA', status:'shipped' },
    { emoji:'🚀', title:'Rocket Nozzle Prototype', meta:'Eindhoven · Metal PLA · 12h', status:'printing' },
    { emoji:'🦋', title:'Butterfly Wing Sculpture', meta:'Groningen · Resin HD', status:'done' },
    { emoji:'🎮', title:'Custom Controller Shell', meta:'Amsterdam · ABS · 3h 20m', status:'shipped' },
    { emoji:'🦴', title:'Orthopedic Implant Test', meta:'Amsterdam UMC · TPU Flex', status:'printing' },
    { emoji:'🌊', title:'Wave Sculpture', meta:'Haarlem · Resin HD', status:'done' },
    { emoji:'🔩', title:'IKEA Part — Kallax', meta:'Amsterdam · ABS · 2h', status:'shipped' },
  ];

  let idx = 0;

  function addItem() {
    const item = items[idx % items.length];
    idx++;

    const el = document.createElement('div');
    el.className = 'lf-item';
    el.innerHTML = `
      <div class="lfi-icon">${item.emoji}</div>
      <div class="lfi-content">
        <div class="lfi-title">${item.title}</div>
        <div class="lfi-meta">${item.meta}</div>
      </div>
      <div class="lfi-status ${item.status}">${item.status}</div>
    `;

    container.insertBefore(el, container.firstChild);

    // Keep max 8 visible items
    while (container.children.length > 8) {
      container.removeChild(container.lastChild);
    }
  }

  // Initial fill
  for (let i = 0; i < 6; i++) addItem();

  // Live updates
  setInterval(addItem, 2800);

  // Animate counters
  let printing = 12, today = 47, cities = 23;
  setInterval(() => {
    printing = Math.max(8, printing + Math.round((Math.random() - 0.5) * 3));
    today += Math.round(Math.random());
    if (Math.random() > 0.8) cities = Math.min(30, cities + 1);
    const ep = document.getElementById('gso-printing');
    const et = document.getElementById('gso-today');
    const ec = document.getElementById('gso-cities');
    if (ep) ep.textContent = printing;
    if (et) et.textContent = today;
    if (ec) ec.textContent = cities;
  }, 3500);
}


/* ════════════════════════════════════════════════════════════════
   GLOBE — Live Universe
════════════════════════════════════════════════════════════════ */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = () => canvas.clientWidth  || 500;
  const H = () => canvas.clientHeight || 420;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W(), H());

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 100);
  camera.position.set(0, 0, 3.8);

  /* — Globe dot sphere — */
  const R = 1.2;
  const DOT_COUNT = 2500;
  const positions = new Float32Array(DOT_COUNT * 3);
  const colors    = new Float32Array(DOT_COUNT * 3);

  const baseC  = new THREE.Color(0x00d4ff);
  const hotC   = new THREE.Color(0xff0080);

  for (let i = 0; i < DOT_COUNT; i++) {
    const phi   = Math.acos(-1 + (2 * i) / DOT_COUNT);
    const theta = Math.sqrt(DOT_COUNT * Math.PI) * phi;
    positions[i*3]   = R * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = R * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = R * Math.cos(phi);

    colors[i*3]   = baseC.r * 0.5;
    colors[i*3+1] = baseC.g * 0.5;
    colors[i*3+2] = baseC.b * 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, opacity: 0.8 });
  const globe = new THREE.Points(geo, mat);
  scene.add(globe);

  /* — Activity blips — */
  const blipGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const blipMat = new THREE.MeshBasicMaterial({ color: 0xff0080, transparent: true, opacity: 0.9 });
  const blips   = [];

  function addBlip() {
    const mesh = new THREE.Mesh(blipGeo, blipMat.clone());
    const phi   = Math.random() * Math.PI;
    const theta = Math.random() * Math.PI * 2;
    mesh.position.set(
      R * Math.sin(phi) * Math.cos(theta),
      R * Math.sin(phi) * Math.sin(theta),
      R * Math.cos(phi)
    );
    mesh.userData = { life: 0, maxLife: 80 };
    scene.add(mesh);
    blips.push(mesh);
  }

  setInterval(() => { if (blips.length < 12) addBlip(); }, 600);

  /* — Rings — */
  const ringGeo = new THREE.TorusGeometry(1.3, 0.004, 8, 80);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.12 });
  const ring    = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  /* — Render — */
  let frame = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    frame++;

    globe.rotation.y = frame * 0.003;
    ring.rotation.z  = frame * 0.001;

    // Update blips
    for (let i = blips.length - 1; i >= 0; i--) {
      const b = blips[i];
      b.userData.life++;
      const t = b.userData.life / b.userData.maxLife;
      b.material.opacity = t < 0.5 ? t * 1.8 : (1 - t) * 1.8;
      b.scale.setScalar(1 + t * 1.5);
      if (b.userData.life >= b.userData.maxLife) {
        scene.remove(b);
        blips.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }
  tick();

  const ro = new ResizeObserver(() => {
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
  });
  ro.observe(canvas);
}


/* ════════════════════════════════════════════════════════════════
   TILT CARDS — Holographic & Pricing
════════════════════════════════════════════════════════════════ */
function initTiltCards() {
  if (state.reduced) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateZ(12px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease';
    });
  });
}


/* ════════════════════════════════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════════════════════════════════ */
function initReveal() {
  const els = document.querySelectorAll('.reveal-up');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
}


/* ════════════════════════════════════════════════════════════════
   COUNTERS — animated number counts
════════════════════════════════════════════════════════════════ */
function initCounters() {
  const els = document.querySelectorAll('.stat-num[data-target]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const target = parseInt(e.target.dataset.target);
      const dur    = 1800;
      const start  = performance.now();

      function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        e.target.textContent = Math.round(ease * target);
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }, { threshold: 0.5 });

  els.forEach(el => obs.observe(el));
}


/* ════════════════════════════════════════════════════════════════
   MATERIAL BARS — animated fill
════════════════════════════════════════════════════════════════ */
function initMatBars() {
  const fills = document.querySelectorAll('.mb-fill');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('animated');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  fills.forEach(el => obs.observe(el));
}


/* ════════════════════════════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form    = document.getElementById('cta-form');
  const success = document.getElementById('cta-success');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('cf-name')?.value.trim();
    const email   = document.getElementById('cf-email')?.value.trim();
    const project = document.getElementById('cf-project')?.value.trim();

    if (!name || !email || !project) {
      // Shake effect
      form.style.animation = 'none';
      form.offsetHeight;
      form.style.animation = 'shake 0.4s ease';
      return;
    }

    // Simulate submission
    const btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Sending...'; }

    setTimeout(() => {
      form.style.display = 'none';
      if (success) success.classList.add('visible');
    }, 1200);
  });
}


/* ════════════════════════════════════════════════════════════════
   BACK TO TOP
════════════════════════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}


/* ════════════════════════════════════════════════════════════════
   AMSTERDAM SKYLINE — building hover effects
════════════════════════════════════════════════════════════════ */
function initSkylineHover() {
  const buildings = document.querySelectorAll('.sky-building');

  buildings.forEach(b => {
    b.addEventListener('mouseenter', () => {
      // Light up windows in this building
      b.querySelectorAll('.sky-window').forEach((w, i) => {
        w.style.transition = `fill ${Math.random() * 0.1 + 0.05}s ease ${i * 0.02}s`;
        const colors = ['rgba(255,215,0,0.9)', 'rgba(245,158,11,0.8)', 'rgba(255,140,0,0.7)', 'rgba(255,200,50,0.8)'];
        w.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)]);
      });
      b.querySelectorAll('.sky-beacon, .sky-ornament').forEach(beacon => {
        beacon.style.filter = 'brightness(3)';
      });
    });

    b.addEventListener('mouseleave', () => {
      b.querySelectorAll('.sky-window').forEach(w => {
        w.style.transition = 'fill 0.6s ease';
        const orig = w.getAttribute('data-orig-fill') || w.getAttribute('fill');
        w.setAttribute('fill', orig);
      });
      b.querySelectorAll('.sky-beacon, .sky-ornament').forEach(beacon => {
        beacon.style.filter = '';
      });
    });

    // Save original fills
    b.querySelectorAll('.sky-window').forEach(w => {
      w.setAttribute('data-orig-fill', w.getAttribute('fill'));
    });
  });

  /* — Subtle water ripple animation — */
  const ripples = document.querySelectorAll('.ripple');
  ripples.forEach((r, i) => {
    r.style.animationDelay = (i * 0.8) + 's';
    r.style.animationDuration = (3 + i * 0.5) + 's';
  });
}


/* ════════════════════════════════════════════════════════════════
   SHAKE ANIMATION (CSS injection)
════════════════════════════════════════════════════════════════ */
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform:none; }
      20%      { transform:translateX(-6px); }
      40%      { transform:translateX(6px);  }
      60%      { transform:translateX(-4px); }
      80%      { transform:translateX(4px);  }
    }

    /* Hover glow on gallery cards */
    .gallery-card:hover .gc-img { filter: brightness(1.15); }

    /* Viral items stagger entrance */
    .viral-item.revealed {
      animation: vi-pop 0.6s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: var(--delay, 0s);
    }
    @keyframes vi-pop {
      from { opacity:0; transform:translateY(30px) scale(0.95); }
      to   { opacity:1; transform:none; }
    }

    /* Pricing featured card pulse */
    .pricing-card-featured {
      animation: pc-pulse 4s ease-in-out infinite;
    }
    @keyframes pc-pulse {
      0%,100% { box-shadow: 0 0 0 1px rgba(255,215,0,0.25); }
      50%     { box-shadow: 0 0 30px rgba(255,215,0,0.18), 0 0 0 1px rgba(255,215,0,0.4); }
    }

    /* Terminal cursor */
    .terminal-input { caret-color: #ffd700; }

    /* Process line dynamic fill */
    .process-line { transition: height 0.1s linear, background 0.1s linear; }

    /* Gallery canvas drag cursor */
    #gallery-canvas { user-select: none; -webkit-user-select: none; }
  `;
  document.head.appendChild(style);
})();


/* ════════════════════════════════════════════════════════════════
   EXTRA POLISH — Micro-interactions
════════════════════════════════════════════════════════════════ */

/* Parallax on hero scroll */
window.addEventListener('scroll', () => {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const heroH = hero.offsetHeight;
  const scroll = window.scrollY;
  if (scroll > heroH) return;

  const content = hero.querySelector('.hero-content');
  if (content) {
    content.style.transform = `translateY(${scroll * 0.25}px)`;
    content.style.opacity   = Math.max(0, 1 - scroll / (heroH * 0.65));
  }
}, { passive: true });


/* Cursor glow on dark sections (desktop only) */
if (window.matchMedia('(pointer: fine)').matches && !state.reduced) {
  const cursor = document.createElement('div');
  cursor.style.cssText = `
    position:fixed; width:300px; height:300px;
    border-radius:50%;
    background:radial-gradient(ellipse, rgba(255,215,0,0.05) 0%, transparent 70%);
    pointer-events:none; z-index:9999;
    transform:translate(-50%,-50%);
    transition:left 0.1s ease,top 0.1s ease;
    will-change:left,top;
  `;
  document.body.appendChild(cursor);

  window.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  }, { passive: true });
}


/* Section entrance glow accents */
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    e.target.style.opacity = e.isIntersecting ? '1' : '';
  });
}, { threshold: 0.05 });

document.querySelectorAll('section').forEach(s => sectionObs.observe(s));


/* Nav logo pulse on hover */
document.querySelector('.nav-logo svg')?.addEventListener('mouseenter', function() {
  this.style.animation = 'loader-spin 1s linear infinite';
});
document.querySelector('.nav-logo svg')?.addEventListener('mouseleave', function() {
  this.style.animation = '';
});
