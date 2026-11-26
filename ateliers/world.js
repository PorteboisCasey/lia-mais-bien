// Monde 3D de la page « Ateliers IA » : un seul nuage de particules qui change de forme
// au fil du défilement (nœud → anneau → 1 → 2 → 3 → VOUS → CASEY → logo WhatsApp),
// se colore selon la diapo (blanc / noir / orange) et s'écarte sous le doigt ou la souris.
// Chargé à la demande par index.html, jamais bloquant. Rendu en pause si l'onglet est caché.
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute,
  ShaderMaterial, Points, Color, Vector3, Group,
} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const OR = '#FF4D00';
// Couleurs [principale, accent] par thème de diapo
const THEMES = { light: ['#000000', OR], dark: [OR, '#ffffff'], orange: ['#000000', '#ffffff'] };
// Part d'accent par forme (1 = toute la forme en couleur d'accent)
const ACCENT = { knot: 0, ring: 1, 1: 1, 2: 1, 3: 1, vous: 0.25, casey: 0, wa: 0 };

export async function run(canvas, { calm: still = false } = {}) {
  const small = Math.min(innerWidth, innerHeight) < 600;
  const N = small ? 4200 : 7500;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const q = new URLSearchParams(location.search);
  const fixed = parseFloat(q.get('t3d')); // ?t3d=4 fige le temps (captures de test)

  // ── Formes ──────────────────────────────────────────────
  const rnd = new Float32Array(N * 3), seed = new Float32Array(N), tint = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    rnd[i * 3] = Math.random() - 0.5; rnd[i * 3 + 1] = Math.random() - 0.5; rnd[i * 3 + 2] = Math.random() - 0.5;
    seed[i] = Math.random(); tint[i] = Math.random() < 0.22 ? 1 : 0;
  }
  const knot = new Float32Array(N * 3), ring = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2, r = 1.1 + 0.55 * Math.cos(7 * t), j = 0.16;
    knot[i * 3] = r * Math.cos(3 * t) * 1.25 + rnd[i * 3] * j;
    knot[i * 3 + 1] = r * Math.sin(3 * t) * 1.25 + rnd[i * 3 + 1] * j;
    knot[i * 3 + 2] = 0.9 * Math.sin(7 * t) + rnd[i * 3 + 2] * j;
    const w = rnd[i * 3] * 0.16;
    ring[i * 3] = (1.6 + w) * Math.cos(t); ring[i * 3 + 1] = (1.6 + w) * Math.sin(t); ring[i * 3 + 2] = rnd[i * 3 + 2] * 0.08;
  }

  // Échantillonne une forme dessinée dans un canvas 2D (texte ou tracé SVG) en N points 3D
  function sample(draw, width = 3.9, depth = 0.45) {
    const W = 640, H = 420, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; draw(g, W, H);
    const d = g.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (let k = 0; k < pts.length; k += 2) { minX = Math.min(minX, pts[k]); maxX = Math.max(maxX, pts[k]); minY = Math.min(minY, pts[k + 1]); maxY = Math.max(maxY, pts[k + 1]); }
    const s = width / Math.max(maxX - minX, (maxY - minY) * 1.1, 1), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const out = new Float32Array(N * 3), n = pts.length / 2;
    for (let i = 0; i < N; i++) {
      const k = n ? (Math.floor(Math.random() * n) * 2) : 0;
      out[i * 3] = ((pts[k] ?? cx) - cx + rnd[i * 3] * 2) * s;
      out[i * 3 + 1] = -((pts[k + 1] ?? cy) - cy + rnd[i * 3 + 1] * 2) * s;
      out[i * 3 + 2] = rnd[i * 3 + 2] * depth;
    }
    return out;
  }
  const text = (str, width) => sample((g, W, H) => {
    let fs = 360; g.font = `400 ${fs}px Anton, Impact, sans-serif`;
    fs = Math.min(360, fs * (W * 0.9) / g.measureText(str).width);
    g.font = `400 ${fs}px Anton, Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(str, W / 2, H / 2);
  }, width);

  try { await Promise.race([document.fonts.load('400 100px Anton', '123VOUSCASEY'), new Promise(r => setTimeout(r, 2500))]); } catch {}
  const waD = document.getElementById('wa-path')?.getAttribute('d');
  const shapes = {
    knot, ring,
    1: text('1', 2.6), 2: text('2', 2.6), 3: text('3', 2.6),
    vous: text('VOUS', 4.2), casey: text('CASEY', 4.2),
    wa: waD ? sample((g, W, H) => { const s = 16; g.translate(W / 2 - 12 * s, H / 2 - 12 * s); g.scale(s, s); g.fill(new Path2D(waD)); }, 3.4, 0.35) : ring,
  };

  // ── Rendu ───────────────────────────────────────────────
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr); renderer.setClearColor(0x000000, 0);
  const scene = new Scene(), camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const group = new Group(); scene.add(group);

  const pos = new Float32Array(N * 3); pos.set(knot);
  const disp = new Float32Array(N * 3); // écart dû au pointeur (ressort amorti)
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
  geo.setAttribute('aTint', new BufferAttribute(tint, 1));
  const uniforms = {
    uSize: { value: (small ? 5.2 : 6) * dpr }, uAcc: { value: 0 }, uAlpha: { value: 1 },
    uA: { value: new Color('#000') }, uB: { value: new Color(OR) },
  };
  const mat = new ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aSeed; attribute float aTint;
      uniform float uSize; varying float vTint;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (9.0 / -mv.z) * (0.75 + aSeed * 0.5);
        vTint = aTint;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uA; uniform vec3 uB; uniform float uAcc; uniform float uAlpha; varying float vTint;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        gl_FragColor = vec4(mix(mix(uA, uB, vTint), uB, uAcc), smoothstep(0.5, 0.3, r) * uAlpha);
        #include <colorspace_fragment>
      }`,
  });
  group.add(new Points(geo, mat));

  // Cadrage : forme à droite (desktop) ou en haut (mobile)
  let visW = 1, visH = 1, wide = true;
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI / 180) / 2); visW = visH * camera.aspect;
    wide = w >= 900;
    const sc = wide ? Math.min(1, (visW * 0.44) / 4.2, (visH * 0.7) / 4.2) : Math.min(1, (visW * 0.86) / 4.2, (visH * 0.4) / 4.2);
    group.scale.setScalar(sc);
    group.position.set(wide ? visW * 0.24 : 0, wide ? 0 : visH * 0.25, 0);
  }
  resize(); addEventListener('resize', resize);

  // Pointeur → position dans le plan de la forme
  const ptr = { x: 9e9, y: 9e9, nx: 0, ny: 0, on: false };
  const v = new Vector3();
  function setPtr(cx, cy) {
    ptr.nx = cx / innerWidth - 0.5; ptr.ny = cy / innerHeight - 0.5; ptr.on = true;
    v.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = -camera.position.z / v.z;
    ptr.x = (camera.position.x + v.x * t - group.position.x) / group.scale.x;
    ptr.y = (camera.position.y + v.y * t - group.position.y) / group.scale.y;
  }
  addEventListener('pointermove', e => setPtr(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) setPtr(t.clientX, t.clientY); }, { passive: true });
  addEventListener('pointerleave', () => { ptr.on = false; });
  addEventListener('touchend', () => { ptr.on = false; });

  // Diapos → forme courante
  const slides = [...document.querySelectorAll('[data-shape]')];
  const themeTarget = { a: new Color(), b: new Color() };
  function scrollState() {
    const vc = innerHeight / 2, cs = slides.map(s => { const r = s.getBoundingClientRect(); return r.top + Math.min(r.height, innerHeight) / 2; });
    let b = cs.findIndex(c => c > vc);
    if (b === -1) return { A: slides.length - 1, B: slides.length - 1, m: 0 };
    if (b === 0) return { A: 0, B: 0, m: 0 };
    const a = b - 1, m = Math.min(Math.max((vc - cs[a]) / (cs[b] - cs[a]), 0), 1);
    return { A: a, B: b, m };
  }
  const ease = x => { x = Math.min(Math.max((x - 0.2) / 0.6, 0), 1); return x * x * (3 - 2 * x); };

  // Boucle
  const t0 = performance.now(); let last = t0, raf = 0, mx = 0, my = 0;
  const loop = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  function frame(now) {
    if (document.hidden) return;
    const t = isNaN(fixed) ? (now - t0) / 1000 : fixed;
    const dt = isNaN(fixed) ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now;

    // Intro du hero : nœud emmêlé 1,2 s, puis démêlage en anneau (1,8 s)
    const k = still ? 1 : Math.min(Math.max((t - 1.2) / 1.8, 0), 1), intro = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const st = scrollState(), m = ease(st.m), mid = Math.sin(m * Math.PI);
    const nameA = slides[st.A].dataset.shape, nameB = slides[st.B].dataset.shape;
    const A = nameA === 'ring' ? null : shapes[nameA], B = nameB === 'ring' ? null : shapes[nameB];

    const r2 = 0.9 * 0.9, swirl = still ? 0 : 0.9 * mid, wob = still ? 0 : 0.025;
    for (let i = 0, j = 0; i < N; i++, j += 3) {
      for (let c = 0; c < 3; c++) {
        const ring0 = knot[j + c] + (ring[j + c] - knot[j + c]) * intro;
        const a = A ? A[j + c] : ring0, b = B ? B[j + c] : ring0;
        pos[j + c] = a + (b - a) * m + rnd[j + c] * swirl * 2.2 + Math.sin(t * 1.4 + seed[i] * 30 + c) * wob;
      }
      // Le pointeur écarte les particules (ressort amorti)
      if (ptr.on) {
        const dx = pos[j] - ptr.x, dy = pos[j + 1] - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < r2) { const d = Math.sqrt(d2) + 1e-4, f = (1 - d / 0.9) * 0.14; disp[j] += dx / d * f; disp[j + 1] += dy / d * f; disp[j + 2] += f * 0.6; }
      }
      disp[j] *= 0.9; disp[j + 1] *= 0.9; disp[j + 2] *= 0.9;
      pos[j] += disp[j]; pos[j + 1] += disp[j + 1]; pos[j + 2] += disp[j + 2];
    }
    geo.attributes.position.needsUpdate = true;

    // Couleurs : thème de la diapo + part d'accent de la forme
    const thA = THEMES[slides[st.A].dataset.theme] || THEMES.light, thB = THEMES[slides[st.B].dataset.theme] || THEMES.light;
    themeTarget.a.set(thA[0]).lerp(new Color(thB[0]), m); themeTarget.b.set(thA[1]).lerp(new Color(thB[1]), m);
    const kc = isNaN(fixed) ? Math.min(dt * 5, 1) : 1;
    uniforms.uA.value.lerp(themeTarget.a, kc); uniforms.uB.value.lerp(themeTarget.b, kc);
    const accA = nameA === 'ring' ? intro : ACCENT[nameA], accB = nameB === 'ring' ? intro : ACCENT[nameB];
    uniforms.uAcc.value = accA + (accB - accA) * m;

    // Mobile : la 3D pâlit dès que du texte remonte dans sa zone (haut de l'écran)
    let alphaT = 1;
    if (!wide) { const tx = slides[m < 0.5 ? st.A : st.B].querySelector('.txt'); if (tx && tx.getBoundingClientRect().top < innerHeight * 0.47) alphaT = 0.16; }
    uniforms.uAlpha.value += (alphaT - uniforms.uAlpha.value) * (isNaN(fixed) ? Math.min(dt * 6, 1) : 1);

    // Mouvement : rotation douce + parallaxe ; le nœud tourne vite, les formes se posent
    mx += (ptr.nx - mx) * 0.05; my += (ptr.ny - my) * 0.05;
    const calm = (nameA === 'ring' && st.m < 0.05) ? intro : 1;
    group.rotation.z = (1 - calm) * t * 0.9;
    group.rotation.y = mx * 0.7 + (still ? 0 : Math.sin(t * 0.4) * 0.22 * calm);
    group.rotation.x = my * 0.45 + 0.35 * (1 - calm);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  document.documentElement.classList.add('gl');
  loop();
}
