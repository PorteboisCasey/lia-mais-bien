// Casey en 3D (Three.js) : la mascotte de js/casey.js modélisée en volume, dans les 3 couleurs de la page
// Ateliers (encre, papier, orange). Rendu « dessin » : aplats à deux tons + cerne noir (coque inversée).
//
//   import { mount } from './casey3d.js';
//   mount(slot, { calm })   // slot = boîte au ratio 62/90 dont le bord bas est le sol sous ses pieds
//
// Le slot pilote la mascotte par attributs :
//   data-pose  = wave | idle | point | think | phone | sit | party
//   data-face  = left | right   (côté vers lequel il se tourne ; par défaut : vers le centre de l'écran)
//   data-theme = light | dark | orange   (par défaut : thème de la page, body.t-dark / body.t-orange)
//   data-x     = position « monde » de Casey en px : quand elle change, il marche (pas calés sur la distance,
//                sens donné par le signe), puis s'arrête et reprend sa pose. Lié au défilement : actif même en mode calme.
// ?walk=0.3 force la marche à cette phase (0 à 1) pour les captures.
// Il suit le pointeur du regard. Boucles (respiration, clin d'œil, coucou) seulement si html.motion ;
// en mode calme les poses changent quand même, en douceur. ?t3d=5 fige le temps (captures de test).
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Color, Vector2, Vector3, Quaternion,
  BoxGeometry, SphereGeometry, CapsuleGeometry, ConeGeometry, TorusGeometry, CircleGeometry, LatheGeometry,
  TubeGeometry, ShapeGeometry, Shape, CatmullRomCurve3, ShaderMaterial, MeshBasicMaterial, BackSide,
} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const INK = '#111111', PAPER = '#ffffff', OR = '#FF4D00';
// [couleur éclairée, couleur dans l'ombre] : l'ombre du blanc tire vers l'orange, pas vers le gris
const TONES = { white: [PAPER, '#ffd2bd'], orange: [OR, '#c63900'], black: ['#3a3a3a', '#0c0c0c'], blush: ['#ffb899', '#ffb899'] };
// Reflet net (« vernis ») par matière : la casquette et le noir brillent, le tissu blanc non
const SPEC = { white: 0, orange: 1, black: 0.8, blush: 0 };
const UP = new Vector3(0, 1, 0);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

// ── Géométries ──────────────────────────────────────────────────────────────
// Boîte arrondie : chaque sommet d'une boîte subdivisée est ramené sur la boîte intérieure, puis repoussé du rayon r.
// Les normales sont lisses et continues aux arêtes : la coque du cerne ne se fend pas.
function rbox(w, h, d, r, s = 10) {
  const g = new BoxGeometry(w, h, d, s, s, s), p = g.attributes.position, n = g.attributes.normal;
  const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r, v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = clamp(x, -ix, ix), cy = clamp(y, -iy, iy), cz = clamp(z, -iz, iz);
    v.set(x - cx, y - cy, z - cz).normalize();
    p.setXYZ(i, cx + v.x * r, cy + v.y * r, cz + v.z * r); n.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
const capsule = (r, len) => new CapsuleGeometry(r, len, 6, 14);
const ball = (r, sx = 1, sy = 1, sz = 1) => { const g = new SphereGeometry(r, 24, 16); g.scale(sx, sy, sz); return g; };
const tube = (pts, r, seg = 20) => new TubeGeometry(new CatmullRomCurve3(pts), seg, r, 6, false);

// Face avant de la tête (boîte arrondie 31,5 × 24 × 26, rayon 9, centrée en y = 12) : profondeur z en (x, y).
// Sert à coucher les traits du visage sur la surface.
function faceZ(x, y) {
  const dx = Math.max(0, Math.abs(x) - 6.75), dy = Math.max(0, Math.abs(y - 12) - 3);
  return 4 + Math.sqrt(Math.max(0, 81 - dx * dx - dy * dy));
}
// Idem pour le sweat (22,5 × 22 × 16,5, rayon 6,5, centré en y = 9,5 dans le repère du torse)
function chestZ(x, y) {
  const dx = Math.max(0, Math.abs(x) - 4.75), dy = Math.max(0, Math.abs(y - 9.5) - 4.5);
  return 1.75 + Math.sqrt(Math.max(0, 42.25 - dx * dx - dy * dy));
}
// Couche une géométrie plate (dessinée en x, y) sur une surface z = f(x, y)
function lay(g, f, lift) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, f(p.getX(i), p.getY(i)) + lift);
  return g;
}
const ellipse = (cx, cy, rx, ry) => { const g = new CircleGeometry(1, 24); g.scale(rx, ry, 1); g.translate(cx, cy, 0); return g; };
// Trait posé sur une surface : courbe de Bézier quadratique (a, c, b) en x, y
function stroke(a, c, b, r, f, lift, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t, x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
    pts.push(new Vector3(x, y, f(x, y) + lift));
  }
  return tube(pts, r, n * 2);
}

// ── Matières ────────────────────────────────────────────────────────────────
// Volume « dessin animé » : ombre douce, bord tournant assombri, petit reflet net. La lumière est fixée
// à la caméra (haut gauche), l'ombre tourne donc avec le volume. Toutes les teintes restent dans la palette.
const CEL_V = /* glsl */`varying vec3 vN; void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const CEL_F = /* glsl */`uniform vec3 uA; uniform vec3 uB; uniform float uS; varying vec3 vN;
  void main() {
    vec3 n = normalize(vN), L = normalize(vec3(-0.5, 0.52, 0.7)), V = vec3(0.0, 0.0, 1.0);
    vec3 c = mix(uB, uA, smoothstep(-0.42, 0.42, dot(n, L)));
    c = mix(c, uB, 0.45 * smoothstep(0.6, 1.0, 1.0 - max(dot(n, V), 0.0)));
    c = mix(c, vec3(1.0), uS * smoothstep(0.5, 0.62, pow(max(dot(n, normalize(L + V)), 0.0), 50.0)));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;
const HULL_V = /* glsl */`uniform float uT; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uT, 1.0); }`;
const HULL_F = /* glsl */`uniform vec3 uC; void main() { gl_FragColor = vec4(uC, 1.0);
    #include <colorspace_fragment>
  }`;

function materials() {
  const cel = {};
  for (const k in TONES) cel[k] = new ShaderMaterial({ uniforms: { uA: { value: new Color(TONES[k][0]) }, uB: { value: new Color(TONES[k][1]) }, uS: { value: SPEC[k] } }, vertexShader: CEL_V, fragmentShader: CEL_F });
  const hull = (c, t) => new ShaderMaterial({ uniforms: { uC: { value: new Color(c) }, uT: { value: t } }, vertexShader: HULL_V, fragmentShader: HULL_F, side: BackSide });
  return {
    cel, ink: hull(INK, 0.95), halo: hull(PAPER, 2.3), haloFlat: hull(PAPER, 0),
    flat: { black: new MeshBasicMaterial({ color: INK }), white: new MeshBasicMaterial({ color: PAPER }), orange: new MeshBasicMaterial({ color: OR }), blush: new MeshBasicMaterial({ color: '#ffb899' }), shade: new MeshBasicMaterial({ color: TONES.white[1] }) },
  };
}

// ── Personnage ──────────────────────────────────────────────────────────────
// Repère : x vers la droite de l'image, y vers le haut (pieds à y = 0, sommet ≈ 85), z vers la caméra.
function build() {
  const M = materials(), halos = [];
  // Volume cerné : aplat + coque noire (sauf sur le noir) + coque blanche (liseré d'autocollant, fond sombre)
  const solid = (geo, tone) => {
    const g = new Group(); g.add(new Mesh(geo, M.cel[tone]));
    if (tone !== 'black') g.add(new Mesh(geo, M.ink));
    const h = new Mesh(geo, M.halo); h.visible = false; halos.push(h); g.add(h);
    return g;
  };
  const flat = (geo, tone) => new Mesh(geo, M.flat[tone]);
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const cone = (r, h, base, dir) => {
    const o = new Group(), d = new Vector3(...dir).normalize(), halo = at(new Mesh(new ConeGeometry(r + 2.3, h + 3, 14), M.haloFlat), 0, 1.5, 0);
    o.add(new Mesh(new ConeGeometry(r, h, 14), M.cel.black), halo); halo.visible = false; halos.push(halo);
    o.position.set(...base).addScaledVector(d, h / 2); o.quaternion.setFromUnitVectors(UP, d); return o;
  };
  const seg = (a, b, r, tone = 'black') => { // bâtonnet de a à b
    const A = new Vector3(...a), B = new Vector3(...b), d = B.clone().sub(A), o = flat(capsule(r, d.length()), tone);
    o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(UP, d.normalize()); return o;
  };

  const rig = new Group(), body = new Group(); rig.add(body);

  // Ombre au sol
  const shadow = new Mesh(new CircleGeometry(1, 40), new MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.scale.set(18, 9, 1); shadow.position.set(3, 0.05, -1.5); shadow.renderOrder = -1; rig.add(shadow);

  // Jambes (jean noir), baskets blanches à semelle orange
  const legs = [-1, 1].map(s => {
    const leg = at(new Group(), 5.1 * s, 21, 0); leg.rotation.y = 0.16 * s; body.add(leg);
    const knee = at(new Group(), 0, -7.5, 0), foot = at(new Group(), 0, -7.5, 0);
    leg.add(at(solid(capsule(2.9, 5.6), 'black'), 0, -3.6, 0), knee); leg.knee = knee; leg.foot = foot;
    knee.add(at(solid(capsule(2.85, 5.6), 'black'), 0, -3.6, 0), foot);
    foot.add(at(solid(rbox(7.8, 2.9, 14.6, 1.4, 6), 'orange'), 0, -4.55, 2.4));
    foot.add(at(solid(rbox(6.7, 5.4, 12.6, 2.6, 8), 'white'), 0, -1.6, 2.2));
    return leg;
  });
  body.add(at(solid(rbox(20.5, 9.5, 14.6, 3.6, 8), 'black'), 0, 23.4, 0)); // bassin

  // Torse : sweat blanc, capuche, cordons orange, poche
  const torso = at(new Group(), 0, 26, 0); body.add(torso);
  torso.add(at(solid(rbox(22.5, 22, 16.5, 6.5, 12), 'white'), 0, 9.5, 0));
  torso.add(at(solid(ball(1, 9.6, 4.4, 6.6), 'white'), 0, 19.6, -4.8));                              // capuche repliée
  torso.add(flat(stroke([-8.2, 18.4], [0, 9.6], [8.2, 18.4], 0.55, chestZ, 0.25), 'black'));         // encolure
  for (const s of [-1, 1]) torso.add(seg([2.5 * s, 14.6, chestZ(2.5, 14.6) + 0.55], [2.6 * s, 10.4, chestZ(2.6, 10.4) + 0.55], 0.7, 'orange'));
  const pk = [[-6, 6.4], [6, 6.4], [5, 1.5], [-5, 1.5]].map(([x, y]) => [x, y, chestZ(x, y) + 0.25]);
  pk.forEach((a, i) => torso.add(seg(a, pk[(i + 1) % 4], 0.5)));                                      // poche kangourou

  // Bras : épaule → coude → main. s = +1 pour le bras à droite de l'image.
  const arms = {}, fores = {};
  for (const [k, s] of [['L', -1], ['R', 1]]) {
    const arm = at(new Group(), 11.4 * s, 16.6, 0), fore = at(new Group(), 0, -8, 0);
    arm.add(at(solid(capsule(2.35, 6.4), 'white'), 0, -3.7, 0));
    fore.add(at(solid(capsule(2.25, 5), 'white'), 0, -3, 0));
    fore.add(at(solid(ball(2.95), 'white'), 0, -7.6, 0));
    arm.add(fore); torso.add(arm); arms[k] = arm; fores[k] = fore;
  }
  // Téléphone (écran orange), un par main : seul celui du bras extérieur s'affiche en pose « phone »
  const phones = {};
  for (const k of ['L', 'R']) {
    const ph = new Group();
    ph.add(solid(rbox(5.6, 9.4, 1.5, 0.75, 4), 'black'), at(flat(rbox(4.4, 7.8, 0.4, 0.2, 2), 'orange'), 0, 0, 0.62));
    ph.scale.setScalar(0.001); fores[k].add(ph); phones[k] = ph;
  }

  // Tête (pivot au cou)
  const head = at(new Group(), 0, 19, 0); torso.add(head);
  head.add(at(solid(rbox(31.5, 24, 26, 9, 16), 'white'), 0, 12, 0)); // le haut du crâne est sous la casquette
  for (const s of [-1, 1]) head.add(at(solid(ball(3.3), 'white'), 15.9 * s, 10.4, -0.5));           // oreilles
  // Cheveux : mèches à l'arrière et sur la nuque, épi qui dépasse de la casquette, frange
  [[[-13.4, 13.5, -9], [-0.8, -0.05, -0.6], 8.5], [[-6.5, 9.5, -11.8], [-0.32, -0.25, -0.92], 8.5], [[3, 12, -12.3], [0.15, 0, -1], 8],
    [[11.5, 10, -10.3], [0.62, -0.15, -0.77], 8.5], [[-14.6, 7.6, -4.5], [-0.93, -0.3, -0.2], 7], [[14.6, 7.6, -4.5], [0.93, -0.3, -0.2], 7]]
    .forEach(([b, d, h]) => head.add(cone(2.9, h, b, d)));
  head.add(cone(2.8, 9, [-2.9, 30.2, -0.6], [-0.3, 1, 0]), cone(2.6, 7.5, [2.5, 30, 0.2], [0.24, 1, 0.05]));
  const fr = new Shape(); fr.moveTo(-11.2, 18.9); fr.lineTo(-8.2, 14.6); fr.lineTo(-6.3, 18.1); fr.lineTo(-4.2, 15.4); fr.lineTo(-2.6, 18.9); fr.closePath();
  head.add(flat(lay(new ShapeGeometry(fr), faceZ, 0.2), 'black'));
  // Casquette : calotte orange (profil tourné, bord arrondi), couture, visière noire
  const prof = [new Vector2(0.01, -1.9), new Vector2(15, -1.9), new Vector2(16.6, -1.6), new Vector2(17.3, -0.7)];
  for (let i = 1; i <= 14; i++) { const t = (i / 14) * Math.PI / 2; prof.push(new Vector2(Math.max(0.01, 17.3 * Math.cos(t)), 13 * Math.sin(t))); }
  const dome = new LatheGeometry(prof, 48); dome.scale(1, 1, 0.87);
  { // plan en « squircle » : la calotte épouse la tête, plus carrée qu'un ovale
    const p = dome.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z / 0.87, x), f = Math.pow(Math.pow(Math.abs(Math.cos(a)), 2.7) + Math.pow(Math.abs(Math.sin(a)), 2.7), -1 / 2.7);
      p.setX(i, x * f); p.setZ(i, z * f);
    }
  }
  head.add(at(solid(dome, 'orange'), 0, 18.5, 0));
  const seam = []; for (let i = 0; i <= 12; i++) { const t = (i / 12) * Math.PI / 2; seam.push(new Vector3(0, 18.5 + 13.15 * Math.cos(t), 15.2 * Math.sin(t))); }
  head.add(flat(tube(seam, 0.45, 24), 'black'));
  const visor = at(solid(ball(1, 14.4, 1.5, 10.6), 'black'), 0, 19.3, 13.6); visor.rotation.x = 0.04; head.add(visor);
  // Lunettes rondes : montures, pont, branches jusqu'aux oreilles
  for (const s of [-1, 1]) {
    head.add(at(new Mesh(new TorusGeometry(4.4, 0.85, 10, 40), M.cel.black), 5.75 * s, 10.2, 13.75));
    head.add(seg([10.1 * s, 10.6, 13.6], [16.3 * s, 10.9, 9.2], 0.6), seg([16.3 * s, 10.9, 9.2], [16.3 * s, 11.1, 1], 0.6));
    head.add(flat(lay(ellipse(10.5 * s, 5.2, 2.7, 1.7), faceZ, 0.12), 'blush'));                      // joues
  }
  head.add(flat(tube([new Vector3(-1.5, 10.5, 13.75), new Vector3(0, 11.5, 13.95), new Vector3(1.5, 10.5, 13.75)], 0.7, 8), 'black'));
  head.add(flat(lay(ellipse(0, 17.9, 14.2, 1.5), faceZ, 0.08), 'shade'));                           // ombre de la visière
  // Yeux : pupilles (suivent le pointeur, clignent) ou yeux rieurs
  const eyes = new Group(), dots = new Group(), happy = new Group(); head.add(eyes); eyes.add(dots, happy);
  for (const s of [-1, 1]) {
    dots.add(at(flat(new CircleGeometry(1.85, 24), 'black'), 5.75 * s, 10, 13.3), at(flat(new CircleGeometry(0.62, 12), 'white'), 5.75 * s + 0.65, 10.7, 13.36));
    happy.add(at(flat(new TorusGeometry(2.3, 0.75, 6, 16, Math.PI), 'black'), 5.75 * s, 9.1, 13.4));
  }
  // Sourcils, nez, bouches
  const brows = [-1, 1].map(s => { const b = seg([5.75 * s - 1.9, 16.1, 13.5], [5.75 * s + 1.9, 16.1, 13.5], 0.75); head.add(b); return b; });
  head.add(flat(stroke([1, 7.7], [-0.4, 6], [1.5, 5.5], 0.55, faceZ, 0.25, 8), 'black'));
  const smile = flat(stroke([-4.4, 5.6], [0, 2.1], [4.4, 5.8], 0.8, faceZ, 0.3), 'black');
  const om = new Shape(); om.moveTo(-4.8, 5.9); om.quadraticCurveTo(0, -1, 4.8, 6.1); om.closePath();
  const open = new Group(); open.add(flat(lay(new ShapeGeometry(om, 16), faceZ, 0.2), 'black'), flat(lay(ellipse(0, 3.6, 2.1, 1.1), faceZ, 0.3), 'orange'));
  const oh = flat(lay(ellipse(0.4, 4.3, 1.6, 2), faceZ, 0.25), 'black');
  head.add(smile, open, oh);

  return { rig, body, torso, head, legs, arms, fores, phones, eyes, dots, happy, brows, smile, open, oh, shadow, halos, M };
}

// ── Poses ───────────────────────────────────────────────────────────────────
// Bras : direction du haut du bras puis de l'avant-bras, dans le repère du torse, écrites pour le bras
// à droite de l'image (x > 0 = vers l'extérieur ; miroir automatique pour l'autre bras).
// « out » = bras côté extérieur (loin du contenu), « in » = bras côté contenu.
const BASE = {
  out: [0.2, -1, 0.05], outF: [0.02, -1, 0.2], in: [0.2, -1, 0.05], inF: [0.02, -1, 0.2],
  head: [0, 0, 0], look: [0, 0], lean: 0, legs: 0, y: 0, hop: 0, brow: 0, phone: 0, mouth: 'smile', eyes: 'dots',
};
const POSES = {
  idle: {},
  wave: { out: [0.88, 0.16, 0.5], outF: [0.52, 0.8, 0.42], head: [0, 0, -0.07], brow: 0.8, mouth: 'open', eyes: 'happy' },
  point: { in: [0.82, 0.5, 0.3], inF: [0.86, 0.47, 0.22], head: [0, 0, 0.06], brow: 0.5, look: [0.6, 0.2] },
  think: { out: [0.1, -0.4, 0.92], outF: [-0.52, 0.66, 0.55], in: [0.1, -0.95, 0.3], inF: [-0.75, -0.3, 0.6], head: [-0.06, 0, -0.1], brow: 0.7, look: [-0.5, 0.9], mouth: 'oh' },
  phone: { out: [0.75, -0.2, 0.63], outF: [0.34, 0.78, 0.53], head: [0, 0, -0.06], look: [-0.9, 0.1], phone: 1 },
  sit: { out: [0.15, -0.8, 0.55], outF: [-0.25, -0.55, 0.8], in: [0.15, -0.8, 0.55], inF: [-0.25, -0.55, 0.8], legs: -1.38, y: -7.5, lean: 0.05 },
  party: { out: [0.9, 0.42, 0.3], outF: [0.5, 0.85, 0.3], in: [0.9, 0.42, 0.3], inF: [0.5, 0.85, 0.3], head: [-0.08, 0, 0], brow: 1, hop: 1, mouth: 'open', eyes: 'happy' },
};
const CH = ['out', 'outF', 'in', 'inF', 'head', 'look']; // canaux vectoriels
const NUM = ['lean', 'legs', 'y', 'hop', 'brow', 'phone']; // canaux scalaires
const DOWN = new Vector3(0, -1, 0);
const STRIDE = 30; // longueur d'un cycle de marche (deux pas), en unités du modèle (Casey mesure ≈ 85)

// ── Montage ─────────────────────────────────────────────────────────────────
export function mount(slot, { calm = false } = {}) {
  const q = new URLSearchParams(location.search), fixed = parseFloat(q.get('t3d')), frozen = !isNaN(fixed);
  const motion = !calm && document.documentElement.classList.contains('motion');
  const canvas = document.createElement('canvas');
  // La toile déborde du slot : place pour le bras levé, l'épi et l'ombre
  canvas.style.cssText = 'position:absolute;left:-45%;top:-15%;width:190%;height:120%;pointer-events:none;opacity:0;transition:opacity .4s ease';
  if (getComputedStyle(slot).position === 'static') slot.style.position = 'relative';
  slot.appendChild(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
  const scene = new Scene(), C = build(); scene.add(C.rig);
  // Cadrage : le slot (62 × 90 unités, sol 2 unités sous les pieds) + les marges de la toile ; caméra légèrement plongeante
  const VIEW_H = 108, CY = 47.5, FOV = 20, D = (VIEW_H / 2) / Math.tan(FOV * Math.PI / 360), PITCH = 0.12;
  const camera = new PerspectiveCamera(FOV, 117.8 / 108, D - 120, D + 160);
  camera.position.set(0, CY + D * Math.sin(PITCH), D * Math.cos(PITCH)); camera.lookAt(0, CY, 0);
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); new ResizeObserver(resize).observe(slot);

  // État : pose courante (lissée) et pose cible
  const cur = JSON.parse(JSON.stringify(BASE)); let tgt = cur, poseName = '', side = 1, theme = '';
  function readPose() {
    const name = POSES[slot.dataset.pose] ? slot.dataset.pose : 'idle';
    if (name === poseName) return; poseName = name;
    tgt = Object.assign(JSON.parse(JSON.stringify(BASE)), POSES[name]);
    C.smile.visible = tgt.mouth === 'smile'; C.open.visible = tgt.mouth === 'open'; C.oh.visible = tgt.mouth === 'oh';
    C.dots.visible = tgt.eyes === 'dots'; C.happy.visible = tgt.eyes === 'happy';
  }
  function readSide() { // se tourne vers le centre de l'écran, sauf data-face
    const r = slot.getBoundingClientRect(), f = slot.dataset.face;
    side = f === 'right' ? -1 : f === 'left' ? 1 : (r.left + r.width / 2 >= innerWidth * 0.45 ? 1 : -1);
  }
  function readTheme() {
    const b = document.body.classList, t = slot.dataset.theme || (b.contains('t-dark') ? 'dark' : b.contains('t-orange') ? 'orange' : 'light');
    if (t === theme) return; theme = t;
    C.halos.forEach(h => { h.visible = t === 'dark'; });
    C.shadow.material.opacity = t === 'dark' ? 0 : t === 'orange' ? 0.26 : 0.2;
  }
  readPose(); readSide(); readTheme();
  new MutationObserver(() => { readPose(); readSide(); readTheme(); }).observe(slot, { attributes: true });
  new MutationObserver(readTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', readSide);

  // Regard : vers le pointeur (souris ou doigt)
  const ptr = { x: 0, y: 0, on: false }, look = { x: 0, y: 0 };
  function setPtr(cx, cy) {
    const r = slot.getBoundingClientRect(), hx = r.left + r.width / 2, hy = r.top + r.height * 0.3;
    ptr.x = clamp((cx - hx) / (innerWidth * 0.5), -1, 1); ptr.y = clamp((cy - hy) / (innerHeight * 0.5), -1, 1); ptr.on = true;
  }
  addEventListener('pointermove', e => setPtr(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) setPtr(t.clientX, t.clientY); }, { passive: true });

  const forced = parseFloat(q.get('walk'));
  let lastX = NaN, phase = 0, walkW = 0, dir = 1, moved = -1e9, ang = NaN;
  const t0 = performance.now(); let last = t0, raf = 0, shown = false;
  const v1 = new Vector3(), v2 = new Vector3(), qi = new Quaternion(), qd = new Quaternion();
  // Oriente un bras : U = direction épaule → coude, F = coude → main ; swing = balancement de l'avant-bras (coucou)
  const setArm = (k, U, F, swing = 0) => {
    const s = k === 'R' ? 1 : -1, c = Math.cos(swing), n = Math.sin(swing);
    v1.set(U[0] * s, U[1], U[2]).normalize(); C.arms[k].quaternion.setFromUnitVectors(DOWN, v1);
    qi.copy(C.arms[k].quaternion).invert();
    v2.set((F[0] * c - F[1] * n) * s, F[0] * n + F[1] * c, F[2]).normalize().applyQuaternion(qi); C.fores[k].quaternion.setFromUnitVectors(DOWN, v2);
  };
  function frame(now) {
    raf = 0; if (document.hidden) return;
    const t = frozen ? fixed : (now - t0) / 1000, dt = frozen ? 1 : Math.min((now - last) / 1000, 0.05); last = now;
    const k = frozen ? 1 : 1 - Math.exp(-dt * 9), live = motion && !frozen ? 1 : 0;

    for (const c of CH) for (let i = 0; i < cur[c].length; i++) cur[c][i] += (tgt[c][i] - cur[c][i]) * k;
    for (const c of NUM) cur[c] += (tgt[c] - cur[c]) * k;
    look.x += ((ptr.on ? ptr.x : 0) - look.x) * (frozen ? 1 : Math.min(dt * 6, 1));
    look.y += ((ptr.on ? ptr.y : 0) - look.y) * (frozen ? 1 : Math.min(dt * 6, 1));

    // Marche : la distance parcourue (data-x) fait avancer le cycle, donc les pieds ne glissent pas
    const xs = parseFloat(slot.dataset.x);
    if (!isNaN(xs)) {
      const dx = isNaN(lastX) ? 0 : xs - lastX; lastX = xs;
      if (Math.abs(dx) > 0.05) { phase += Math.abs(dx) * 90 / Math.max(slot.clientHeight, 1) / STRIDE * Math.PI * 2; dir = Math.sign(dx); moved = now; }
    }
    let walkT = now - moved < 240 ? 1 : 0;
    if (!isNaN(forced)) { walkT = 1; phase = forced * Math.PI * 2; dir = 1; }
    walkW += (walkT - walkW) * (frozen || !isNaN(forced) ? 1 : 1 - Math.exp(-dt * 10));
    const w = walkW, sp = Math.sin(phase), cp = Math.cos(phase);

    // Corps : de trois quarts vers le contenu (un peu vers le pointeur) ; de profil vers sa marche
    const breath = live * Math.sin(t * 1.9) * (1 - w), hop = cur.hop * (live ? Math.abs(Math.sin(t * 6.2)) * 4.5 : 1.5);
    const stand = -0.34 * side + look.x * 0.22, aim = stand + (dir * 0.72 - stand) * w; // trois quarts : on voit encore ses yeux
    ang = isNaN(ang) || frozen ? aim : ang + (aim - ang) * Math.min(dt * 12, 1);
    C.rig.rotation.y = ang;
    C.body.position.y = cur.y * (1 - w) + hop + w * 1.3 * (Math.abs(cp) - 0.6);
    C.torso.rotation.x = cur.lean + 0.08 * w; C.torso.scale.y = 1 + breath * 0.012;
    C.legs.forEach((l, i) => {
      const sg = i ? -1 : 1, legs = cur.legs * (1 - w);
      l.rotation.x = legs + w * 0.55 * sg * sp;
      l.knee.rotation.x = -legs + w * 0.8 * Math.max(0, -sg * cp) + cur.hop * (live ? 0.25 * Math.abs(Math.cos(t * 6.2)) : 0);
    });

    // Bras : extérieur / intérieur selon le côté regardé ; le coucou balance l'avant-bras
    const O = side > 0 ? 'R' : 'L', I = side > 0 ? 'L' : 'R';
    const wave = poseName === 'wave' ? live * Math.sin(t * 7.5) * 0.36 : poseName === 'party' ? live * Math.sin(t * 9) * 0.25 : 0;
    const nudge = poseName === 'point' ? live * Math.sin(t * 3.2) * 0.05 : 0;
    // Bras : la pose, ou le balancement de marche (opposé aux jambes)
    const mix3 = (a, b) => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
    const arm = (k, U, F, sw) => { const z = (k === 'L' ? 1 : -1) * 0.5 * sp; setArm(k, mix3(U, [0.12, -1, z]), mix3(F, [0.04, -1, 0.4 + z * 0.6]), sw * (1 - w)); };
    arm(O, cur.out, cur.outF, wave);
    arm(I, cur.in, cur.inF, poseName === 'party' ? wave : nudge);
    // Téléphone : tenu droit, écran vers nous, quel que soit l'angle du bras
    const ph = C.phones[O], so = O === 'R' ? 1 : -1;
    C.phones[I].scale.setScalar(0.001); ph.scale.setScalar(Math.max(cur.phone, 0.001));
    qi.copy(C.arms[O].quaternion).multiply(C.fores[O].quaternion).invert();
    ph.quaternion.copy(qi).multiply(qd.setFromAxisAngle(v1.set(0, 0, 1), -0.14 * so));
    ph.position.set(0.4 * so, 2.6, 2.7).applyQuaternion(qi).add(v2.set(0, -7.6, 0));

    // Tête et yeux
    C.head.rotation.set(cur.head[0] + look.y * 0.26 + breath * 0.008, 0.1 * side + look.x * 0.5 + cur.head[1], cur.head[2] * side + live * Math.sin(t * 0.9) * 0.02);
    C.head.position.y = 19 + breath * 0.2;
    const blink = live && poseName !== 'wave' && poseName !== 'party' && (t % 3.7) > 3.58 ? 0.1 : 1;
    C.eyes.position.set(clamp(look.x * 1.5 + cur.look[0] * -side, -1.5, 1.5), clamp(-look.y * 1.2 + cur.look[1], -1.3, 1.3), 0);
    C.dots.scale.y = blink; C.dots.position.y = (1 - blink) * 10;
    C.brows.forEach((b, i) => { b.position.y = 16.3 + cur.brow * (poseName === 'think' && i === (side > 0 ? 1 : 0) ? 1.6 : 0.7); });

    renderer.render(scene, camera);
    if (!shown) { shown = true; canvas.style.opacity = 1; const s = slot.querySelector('svg'); if (s) s.style.visibility = 'hidden'; slot.classList.add('is-3d'); }
    raf = requestAnimationFrame(frame);
  }
  const loop = () => { if (!raf) raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = performance.now(); loop(); } });
  loop();
  return { canvas, parts: C };
}
