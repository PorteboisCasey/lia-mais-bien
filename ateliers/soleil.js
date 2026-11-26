// Décor « Plein soleil » de la page Ateliers : Marseille en aplats, façon affiche de voyage.
// Pas de nuage de particules, aucune librairie : une couche SVG fixe derrière le contenu, et un emplacement
// #casey3d-slot posé sur la Corniche (index.html y monte la mascotte 3D ; le dessin 2D sert de repli).
//  - le disque du soleil remplace le nuage de particules et porte le symbole de la diapo (1, 2, 3, VOUS) ;
//  - le jour passe au fil du défilement : matin (blanc) → nuit (diapo noire : lune, étoiles, ville éclairée)
//    → grand soleil sur l'horizon (diapo orange) ;
//  - travelling latéral : un panoramique `pan` avance à chaque diapo, chaque plan glisse à sa vitesse
//    (ciel 0, colline 0,1, îles 0,25, ferry à part, bateaux 0,35, mouettes 0,5, vagues 0,6, Corniche 1) ;
//  - Casey marche sur la Corniche : il garde sa place à l'écran, sa position « monde » (écran + pan) est
//    écrite dans slot.dataset.x, la 3D en tire la marche ; il s'arrête à chaque diapo (zones mortes de ease) ;
//  - Casey change de pose à chaque diapo (attribut data-pose de l'emplacement).
// Tout ce qui bouge est lié au défilement ; houle, branche, étoiles, mouettes et ferry ne s'animent seuls que si html.motion.
import { avatar } from './avatar.js';

const OR = '#FF4D00';
// Par diapo : pose de Casey, symbole dans le soleil
const POSES = ['wave', 'phone', 'point', 'party', 'point', 'wave', 'phone'];
const SYMS = ['', '1', '2', '3', 'VOUS', '', ''];
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = x => { x = clamp((x - 0.15) / 0.7, 0, 1); return x * x * (3 - 2 * x); };
const f1 = n => Math.round(n * 10) / 10;
// Tirage stable (même dessin à chaque chargement)
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

const CSS = `
.fallback,.num{display:none!important}
#soleil{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;opacity:0;transition:opacity .4s ease;
  --sil:#000;--rim:#000;--ln:#000;--sun:${OR};--gold:${OR};--deck:#fff;--glow:#fff;--night:0}
#soleil.on{opacity:var(--o,1)}
body.t-dark #soleil{--rim:#fff;--ln:#fff;--deck:#000;--glow:${OR};--night:1}
body.t-orange #soleil{--sun:#fff;--gold:#fff}
#soleil .sc{position:absolute;left:0;top:0;display:block}
#soleil .sc *{vector-effect:non-scaling-stroke}
#soleil .rim *,#soleil .fil *,#soleil .t{transition:fill .7s ease,stroke .7s ease,opacity .7s ease}
#soleil .rim *{fill:var(--rim);stroke:var(--rim);stroke-width:4px;stroke-linejoin:round}
#soleil .fil *{fill:var(--sil);stroke:none}
#soleil .thin .rim *{stroke-width:2.5px}
#soleil .rim .br{fill:none;stroke-width:calc(var(--bw) + 4px);stroke-linecap:round}
#soleil .fil .br{fill:none;stroke:var(--sil);stroke-width:var(--bw);stroke-linecap:round}
#soleil .disc{fill:var(--sun)}
#soleil .gold{fill:var(--gold)}
#soleil .moon,#soleil .star{fill:#fff}
#soleil .ln{fill:none;stroke:var(--ln);stroke-width:3px;stroke-linecap:round;stroke-linejoin:round}
#soleil .wv{stroke-width:2.5px}
#soleil .jib{fill:#fff;stroke:#000;stroke-width:2px;stroke-linejoin:round}
#soleil .rf{fill:var(--sun)}
body.t-dark #soleil .rf{fill:#fff}
#soleil .night{opacity:var(--night)}
#soleil .lit{fill:${OR}}
#soleil .sym{fill:#fff;font-family:var(--display);text-anchor:middle}
#soleil .in,#soleil .pine,#soleil .gu,#soleil .fe{transform-box:fill-box}
#soleil .in{transform-origin:50% 50%}
#soleil .pine{transform-origin:100% 0}
#soleil .gu{transform-origin:50% 70%}
#soleil .fe{transform-origin:50% 100%}
#soleil .deck{fill:var(--deck);stroke:var(--ln);stroke-width:3px;stroke-linejoin:round}
#soleil .dj{fill:none;stroke:var(--ln);stroke-width:2px}
#soleil .jt{fill:none;stroke:#fff;stroke-width:1.5px;stroke-linecap:round;opacity:.9}
body.t-dark #soleil .jt{opacity:.38}
#soleil .glow{fill:var(--glow)}
#soleil .cab{fill:#fff;stroke:#000;stroke-width:2px;stroke-linejoin:round}
#soleil .fun{fill:${OR};stroke:#000;stroke-width:2px;stroke-linejoin:round}
#soleil .pw{fill:#000}
body.t-dark #soleil .pw{fill:${OR}}
#soleil .moi{position:absolute;left:0;bottom:0;font-family:var(--hand);color:${OR};white-space:nowrap;line-height:1;opacity:0;transform-origin:0 100%;rotate:-7deg}
#soleil .moi svg{position:absolute;left:-.1em;top:96%;width:.9em;height:.9em;overflow:visible}
#soleil .moi.up svg{left:52%;transform:scaleX(-1)}
#soleil .moi path{fill:none;stroke:${OR};stroke-width:3px;stroke-linecap:round;stroke-linejoin:round}
#casey3d-slot{position:fixed;left:0;top:0;z-index:0;pointer-events:none;transform-origin:50% 100%;transition:opacity .4s ease}
#casey3d-slot>svg{display:block;width:100%;height:100%;transform:translateY(2.2%)}
@media (max-width:899px){
  .slide{justify-content:flex-start;padding-top:calc(var(--so-zone,46svh) + 18px);padding-bottom:96px}
  .hero .ctas .btn-wa{display:none}
  .hero .sub{margin-top:18px}.hero .ctas{margin-top:16px}
  .txt:has(.who) h2{margin-bottom:14px}
  .who{grid-template-columns:1fr 1fr;gap:10px}
  .who div{padding:11px 11px 13px;border-width:2.5px;border-radius:14px;box-shadow:4px 4px 0 #000}
  .who div:hover,.who div:focus-within{box-shadow:6px 6px 0 #000}
  .who b{font-size:20px;margin-bottom:4px}
  .who span{display:block;font-size:13.5px;line-height:1.3}
}
@media (min-width:900px){
  .bar .btn-wa{box-shadow:0 0 0 3px #fff,0 10px 30px -10px rgba(0,0,0,.45)}
  body.t-dark .bar .btn-wa{box-shadow:0 0 0 3px #000}
}
html.motion #soleil.on .in{animation:so-rise .9s cubic-bezier(.2,1.25,.3,1) both}
html.motion #casey3d-slot{animation:so-hop .6s .35s cubic-bezier(.2,1.5,.4,1) backwards}
html.motion #soleil .wv{animation:so-drift 6s ease-in-out infinite alternate}
html.motion #soleil .pine{animation:so-sway 7s ease-in-out infinite alternate}
html.motion #soleil .bi{animation:so-sail 9s ease-in-out infinite alternate}
html.motion #soleil .boat+.boat .bi{animation-duration:11s;animation-direction:alternate-reverse}
html.motion #soleil .star:nth-child(odd){animation:so-twk 2.3s ease-in-out infinite alternate}
html.motion #soleil .star:nth-child(3n){animation:so-twk 3.1s .6s ease-in-out infinite alternate}
html.motion #soleil .rf:nth-child(odd){animation:so-drift 3.4s ease-in-out infinite alternate}
html.motion #soleil .rf:nth-child(even){animation:so-drift 3.4s ease-in-out infinite alternate-reverse}
html.motion #soleil .gd{animation:so-glide 9s ease-in-out infinite alternate}
html.motion #soleil .gw:nth-child(2) .gd{animation-duration:11s;animation-direction:alternate-reverse}
html.motion #soleil .gw:nth-child(3) .gd{animation-duration:7.5s}
html.motion #soleil .gu{animation:so-flap 2.8s ease-in-out infinite}
html.motion #soleil .gw:nth-child(2) .gu{animation-duration:3.4s;animation-delay:-1.1s}
html.motion #soleil .gw:nth-child(3) .gu{animation-duration:2.4s;animation-delay:-.5s}
html.motion #soleil .fe{animation:so-ferry 13s ease-in-out infinite alternate}
@keyframes so-rise{from{translate:0 160px;scale:.55;opacity:0}}
@keyframes so-hop{from{scale:.6;opacity:0}}
@keyframes so-drift{from{translate:-8px 0}to{translate:8px 0}}
@keyframes so-sway{from{rotate:-1.3deg}to{rotate:1.5deg}}
@keyframes so-sail{from{translate:-14px 0;rotate:-2deg}to{translate:14px 0;rotate:2deg}}
@keyframes so-twk{from{opacity:.2}}
@keyframes so-glide{from{translate:-16px 4px}to{translate:16px -6px}}
@keyframes so-flap{0%,52%,100%{scale:1 1}63%{scale:1 -.45}74%{scale:1 1}85%{scale:1 -.45}}
@keyframes so-ferry{0%{translate:-14px 0;rotate:-.6deg}50%{rotate:.6deg}100%{translate:14px 0;rotate:-.4deg}}
`;

// Silhouette : un liseré (invisible le jour, blanc la nuit) sous le même tracé rempli
const sil = m => `<g class="rim">${m}</g><g class="fil">${m}</g>`;
// Houppier de pin parasol : dôme à fond presque plat
const dome = (x, y, a, h) => `<path d="M${x - a} ${y}C${x - a} ${y - h * 1.35} ${x + a} ${y - h * 1.35} ${x + a} ${y}Q${x} ${y + h * 0.3} ${x - a} ${y}Z"/>`;

// Colline de la Garde et sa basilique (origine : pied de la colline, sur l'horizon)
const HILL = sil(
  '<path d="M-140 2C-98-6-74-52-34-62C-12-67 16-67 38-60C78-46 100-10 146 2Z"/>' +
  '<rect x="-36" y="-88" width="46" height="30"/><path d="M-34-88a12 12 0 0 1 24 0Z"/>' +
  '<rect x="9" y="-124" width="18" height="66"/><rect x="12.5" y="-139" width="11" height="17"/>') +
  '<rect class="gold t" x="16" y="-153" width="4" height="15" rx="1"/><circle class="gold t" cx="18" cy="-156" r="3.6"/>' +
  '<g class="night t">' + [[-104, -8], [-84, -20], [-66, -34], [-52, -14], [-24, -44], [-6, -22], [34, -38], [52, -18], [72, -30], [92, -12], [118, -6], [14, -8]]
    .map(([x, y]) => `<rect class="lit" x="${x}" y="${y}" width="6" height="6"/>`).join('') +
  '<rect class="lit" x="-24" y="-80" width="5" height="10"/><rect class="lit" x="-8" y="-80" width="5" height="10"/><rect class="lit" x="15.5" y="-112" width="5" height="12"/></g>';
// Îles du Frioul et château d'If (origine : centre, sur l'horizon)
const ISLES = sil(
  '<path d="M-150 1C-128-9-104-17-80-14C-62-22-38-24-20-12C0-17 22-8 44 1Z"/>' +
  '<path d="M86 1L91-6H98V-17H105V-11H118V-19H125V-6L131 1Z"/>');
// Île Maïre et son îlot (origine : centre, sur l'horizon) : elle entre en scène pendant le travelling
const MAIRE = sil('<path d="M-58 1C-44-4-34-14-24-24C-16-32-8-36-2-33C6-29 12-20 22-13C34-5 46-1 60 1Z"/><path d="M68 1C73-5 80-6 88 1Z"/>');
// Voilier (origine : ligne de flottaison)
const BOAT = '<g class="bi">' + sil('<path d="M-14 0H14L10 7H-10Z"/>') +
  '<path class="gold t" d="M1-3V-31L17-3Z"/><path class="jib" d="M-2-5V-25L-13-5Z"/></g>';
// Ferry (origine : ligne de flottaison, proue à droite) : coque noire, cabine blanche à hublots, cheminée orange
const FERRY = '<g class="fe">' + sil('<path d="M-39-10H44L34 0H-36Z"/>') +
  '<path class="cab" d="M-31-10V-19H25L29-10Z"/><path class="cab" d="M-22-19V-26H12L16-19Z"/>' +
  '<path class="fun" d="M-15-26L-13-36H-5L-6-26Z"/><path d="M-13-36H-5L-5.4-33H-12.4Z"/>' +
  [-26, -19, -12, -5, 2, 9, 16].map(x => `<rect class="pw" x="${x}" y="-16.5" width="3.6" height="3.4" rx=".8"/>`).join('') +
  [-14, -8, -2, 4].map(x => `<rect class="pw" x="${x}" y="-24" width="3" height="2.6"/>`).join('') + '</g>';
// Lampadaire de la Corniche (origine : pied, sur le plateau ; 100 unités de haut) et banc
const LAMP = sil('<path d="M-6 0V-5H-3.5V-9H3.5V-5H6V0Z"/><rect x="-1.8" y="-76" width="3.6" height="68"/><rect x="-3.6" y="-44" width="7.2" height="4" rx="1"/>' +
  '<path d="M-5-76H5V-79H-5Z"/><path d="M-8.5-90H8.5L5.5-79H-5.5Z"/><path d="M-11-90L0-98L11-90Z"/><circle cx="0" cy="-100" r="2.4"/>') +
  '<path class="glow t" d="M-5.6-87.6H5.6L3.6-81.4H-3.6Z"/>';
const BENCH = '<g class="thin">' + sil('<rect x="-17" y="-11" width="34" height="3.4" rx="1"/><rect x="-17" y="-19.5" width="34" height="3.4" rx="1"/>' +
  '<rect x="-15" y="-19.5" width="2.6" height="12"/><rect x="12.4" y="-19.5" width="2.6" height="12"/><rect x="-14" y="-8" width="2.6" height="8"/><rect x="11.4" y="-8" width="2.6" height="8"/>') + '</g>';
// Branche de pin parasol (origine : coin haut droit de l'écran)
const PINE = sil(
  '<path class="br" d="M40 150C-30 142-110 118-262 112"/><path class="br" d="M-64 132L-72 70"/><path class="br" d="M-176 118L-188 84"/><path class="br" d="M0 146L-8 34"/>' +
  dome(-14, 40, 96, 38) + dome(-84, 78, 92, 34) + dome(-204, 96, 84, 30) + dome(-132, 44, 70, 28) + dome(-282, 122, 46, 20));
const STAR = s => `M0 ${-s}Q0 0 ${s} 0Q0 0 0 ${s}Q0 0 ${-s} 0Q0 0 0 ${-s}Z`;
// Étoiles : [x, y] en fraction de la zone de ciel, taille
const STARS = [[.08, .12, 7], [.2, .3, 4], [.3, .08, 5], [.42, .2, 8], [.55, .1, 4], [.66, .34, 5], [.78, .16, 7], [.9, .3, 4], [.95, .08, 5], [.14, .52, 4], [.5, .44, 5], [.84, .5, 6], [.34, .56, 4], [.7, .58, 4]];
// Mouettes : [place dans leur couloir (0-1), hauteur (0-1 dans le couloir vertical), taille]
const GULLS = [[.08, .55, 1], [.42, 0, .8], [.74, 1, .66]];
const GULL = '<path class="ln gu t" d="M-12 2C-9-4-4-6 0 1C4-6 9-4 12 2"/>';

export function run(ctx) {
  const d = document;
  const slides = (ctx && ctx.slides && ctx.slides.length) ? ctx.slides : [...d.querySelectorAll('.slide')];
  const hero = slides[0], n = slides.length;
  d.head.appendChild(Object.assign(d.createElement('style'), { textContent: CSS }));

  // Plans du travelling : data-v = vitesse par rapport au panoramique (du fond vers l'avant)
  const layer = d.createElement('div');
  layer.id = 'soleil'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `<svg class="sc" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="so-sky"><rect class="sky" x="0" y="0"/></clipPath>
<mask id="so-cr" maskUnits="userSpaceOnUse"><rect class="mk" x="0" y="0" fill="#fff"/><circle class="bite" fill="#000"/></mask></defs>
<g class="night t stars">${STARS.map(s => `<path class="star" d="${STAR(s[2])}"/>`).join('')}</g>
<g clip-path="url(#so-sky)"><g class="in"><circle class="disc t"/>${SYMS.map(s => `<text class="sym">${s}</text>`).join('')}</g>
<g mask="url(#so-cr)"><circle class="moon"/></g></g>
<g class="gulls">${GULLS.map(() => `<g class="gw"><g class="gd">${GULL}</g></g>`).join('')}</g>
<g class="refl"><rect class="rf t"/><rect class="rf t"/><rect class="rf t"/><rect class="rf t"/></g>
<path class="ln hz t"/>
<g class="px" data-v=".1"><g class="hill">${HILL}</g></g>
<g class="px" data-v=".25"><g class="isles">${ISLES}</g><g class="isles2">${MAIRE}</g></g>
<g class="ferry">${FERRY}</g>
<g class="px" data-v=".35"><g class="boat">${BOAT}</g><g class="boat">${BOAT}</g></g>
<g class="px" data-v=".6"><path class="ln wv t"/></g>
<g class="px cor" data-v="1"></g>
<g class="pineP"><g class="pine">${PINE}</g></g>
</svg><div class="moi">C'est moi&nbsp;!<svg viewBox="0 0 30 30"><path d="M27 3C22 15 14 21 4 22M12 14L4 22L14 26"/></svg></div>`;
  const main = d.querySelector('main');
  d.body.insertBefore(layer, main);

  // Emplacement de Casey : boîte 62/90 dont le bord bas est le sol. index.html y monte la mascotte 3D
  // (elle suit data-pose, et marche d'après data-x) ; le SVG 2D reste en repli tant qu'il n'y a pas de canvas.
  const slot = d.createElement('div');
  slot.id = 'casey3d-slot'; slot.dataset.pose = POSES[0]; slot.setAttribute('aria-hidden', 'true');
  slot.appendChild(avatar(POSES[0], { outline: '#fff', width: 3 }));
  d.body.insertBefore(slot, main);
  const setPose = p => {
    if (slot.dataset.pose === p) return;
    slot.dataset.pose = p;
    const old = slot.querySelector(':scope > svg');
    if (old && !slot.querySelector('canvas')) old.replaceWith(avatar(p, { outline: '#fff', width: 3 }));
  };

  const $ = s => layer.querySelector(s), $$ = s => [...layer.querySelectorAll(s)];
  const sc = $('.sc'), disc = $('.disc'), moon = $('.moon'), bite = $('.bite'), syms = $$('.sym'), rfs = $$('.rf');
  const moi = $('.moi'), stars = $$('.star'), pxs = $$('.px'), gws = $$('.gw'), ferry = $('.ferry');

  let W = 0, H = 0, wide = true, K = 1, hz = 0, feet = 0, hC = 0, key = [], raf = 0;
  // Mobile : part de l'écran occupée par le décor (le texte commence juste en dessous). Plus basse sur les petits écrans,
  // pour que le texte de l'accueil tienne au-dessus de la barre WhatsApp.
  let Z = 0.46;
  let gb = [0, 0, 0, 0], fx = [0, 0], fK = 1;
  const at = i => key[Math.min(i, key.length - 1)];

  // Mise en place : Casey devant le soleil dans le hero, puis à gauche du soleil (il le montre du doigt)
  function layout() {
    W = innerWidth; H = innerHeight; wide = W >= 900;
    sc.setAttribute('width', W); sc.setAttribute('height', H);
    if (W < 900) d.documentElement.style.setProperty('--so-zone', Math.round((H < 700 ? 0.39 : H < 780 ? 0.42 : 0.46) * H) + 'px'); sc.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // Hauteur du texte du hero (bas, en coordonnées de page) : l'horizon passe dessous, le décor ne monte pas dessus
    const hb = hero.querySelector('.txt').getBoundingClientRect().bottom + scrollY;
    let sunA, rB, xB, yB, dy, fin, mUp, mr, xC, hill, isles, maire, boats, kp, sky, P, pt, fb, lh, lK, bK;
    if (wide) {
      K = Math.min(H / 900, W / 1440 * 1.15);
      hz = Math.round(clamp(hb + 46, 0.78 * H, 0.88 * H));
      feet = Math.min(hz + 0.09 * H, H - 34);
      hC = 0.48 * H;
      const rA = Math.min(0.18 * W, 0.3 * H);
      sunA = { x: 0.75 * W, y: feet - 0.667 * hC - 0.22 * rA, r: rA };
      rB = Math.min(0.145 * W, 0.25 * H); xB = 0.825 * W; yB = hz - rB - 0.09 * H; dy = 0.016 * H;
      fin = { x: 0.86 * W, y: hz, r: Math.min(0.2 * W, 0.4 * H) };
      mr = 0.05 * W + 12; mUp = { x: 0.86 * W, y: 0.34 * H, r: mr };
      xC = 0.615 * W;
      hill = [0.95 * W, K * 1.35]; isles = [0.2 * W, K * 1.1]; maire = [0.64 * W, K]; kp = K * 1.45;
      boats = [[0.4 * W, K], [1.1 * W, K * 0.8]];
      P = 0.2 * W; pt = 13 * K; fb = H + 20;
      lh = clamp(feet - hb - 12, 40 * K, 96 * K); bK = K * 1.1;
      // Mouettes : couloir dans le ciel à droite du texte, sous la branche de pin
      gb = [0.6 * W, 0.98 * W, 0.27 * H, 0.37 * H]; fK = K * 0.78;
      sky = [0.5 * W, 0, 0.5 * W, hz - 0.2 * H];
    } else {
      Z = H < 700 ? 0.39 : H < 780 ? 0.42 : 0.46;
      const Hm = H * Z / 0.46;
      K = Math.min(W / 390, Hm / 844);
      hz = Math.round(0.365 * Hm); feet = 0.405 * Hm;
      hC = 0.255 * Hm;
      const rA = Math.min(0.32 * W, 0.142 * Hm);
      sunA = { x: 0.5 * W, y: feet - 0.667 * hC - 0.2 * rA, r: rA };
      rB = Math.min(0.27 * W, 0.125 * Hm); xB = 0.655 * W; yB = hz - rB - 0.04 * Hm; dy = 0.008 * Hm;
      fin = { x: 0.66 * W, y: hz, r: Math.min(0.3 * W, 0.16 * Hm) };
      mr = 0.1 * W; mUp = { x: 0.62 * W, y: 0.16 * Hm, r: mr };
      xC = 0.21 * W;
      hill = [0.9 * W, K * 0.6]; isles = [0.13 * W, K * 0.42]; maire = [0.74 * W, K * 0.42]; kp = K * 0.72;
      boats = [[0.36 * W, K * 0.5], [1.12 * W, K * 0.45]];
      P = 0.35 * W; pt = 7 * K; fb = 0.452 * Hm;
      lh = 56 * K; bK = K * 0.6;
      gb = [0.44 * W, 1.02 * W, 0.15 * Hm, 0.21 * Hm]; fK = K * 0.46;
      sky = [0, 0, W, hz - 0.06 * Hm];
    }
    const down = r => hz + r + 14;
    key = slides.map((_, i) => ({
      sun: i === 0 ? sunA : i <= 4 ? { x: xB, y: yB + (i - 1) * dy, r: rB } : i === 5 ? { x: xB, y: down(rB), r: rB } : fin,
      moon: i === 5 ? mUp : { x: mUp.x + 0.04 * W, y: down(mr), r: mr },
      cz: i === 0 ? sunA.x : xC,
      pan: i * P,
    }));
    const maxPan = (n - 1) * P, cw = hC * 62 / 90;
    // Ferry : d'un bord à l'autre de l'écran sur toute la hauteur de la page
    fx = [-50 * fK, W + 50 * fK];

    $('.sky').setAttribute('width', W); $('.sky').setAttribute('height', hz);
    $('.mk').setAttribute('width', W); $('.mk').setAttribute('height', H);
    $('.hz').setAttribute('d', `M-10 ${hz}H${W + 10}`);
    const place = (el, p, y) => el.setAttribute('transform', `translate(${f1(p[0])} ${f1(y)}) scale(${f1(p[1] * 100) / 100})`);
    place($('.hill'), hill, hz); place($('.isles'), isles, hz); place($('.isles2'), maire, hz);
    $$('.boat').forEach((b, i) => place(b, boats[i], hz + 1));
    $('.pineP').setAttribute('transform', `translate(${W} 0) scale(${f1(kp * 100) / 100})`);
    $('.pineP').style.setProperty('--bw', (wide ? 9 : 5) + 'px');
    slot.style.width = f1(cw) + 'px'; slot.style.height = f1(hC) + 'px';
    stars.forEach((s, i) => s.setAttribute('transform', `translate(${f1(sky[0] + STARS[i][0] * sky[2])} ${f1(sky[1] + 12 + STARS[i][1] * sky[3])}) scale(${wide ? 1 : 0.7})`));
    gws.forEach((g, i) => g.querySelector('.gd').setAttribute('transform', `scale(${f1(GULLS[i][2] * K * (wide ? 2.6 : 1.5) * 100) / 100})`));

    // Houle : petites vagues semées de façon stable, entre l'horizon et la Corniche, sur toute la longueur du travelling
    const rnd = rng(7);
    let dw = '';
    const step = (wide ? 24 : 13) * K, LW = W + maxPan * 0.6 + 40, cols = Math.max(2, Math.round(LW / (wide ? 230 : 120)));
    for (let y = hz + step * 0.7; y < feet - (wide ? 8 : 5) * K; y += step) {
      for (let i = 0; i < cols; i++) {
        const x = ((i + rnd()) / cols) * LW, l = (wide ? 8 : 5) * K * (0.8 + rnd() * 0.6);
        dw += `M${f1(x)} ${f1(y)}q${f1(l)} ${f1(-l * 0.7)} ${f1(2 * l)} 0t${f1(2 * l)} 0`;
      }
    }
    $('.wv').setAttribute('d', dw);

    // Corniche : plateau blanc (bord haut = pieds de Casey) sur une façade noire à joints de pierre,
    // lampadaires et bancs espacés ; dessinée une fois, assez longue pour tout le travelling
    const L = W + maxPan + 60, ft = feet + pt, ch = (wide ? 25 : 12) * K, sw = (wide ? 100 : 46) * K;
    let jt = '', dj = '';
    for (let y = ft + ch; y < fb - 3; y += ch) jt += `M-40 ${f1(y)}H${f1(L)}`;
    for (let y0 = ft, r = 0; y0 < fb - 3; y0 += ch, r++) {
      const y1 = Math.min(y0 + ch, fb);
      for (let x = -40 + (r % 2 ? sw * 0.5 : 0) + rnd() * sw * 0.3; x < L; x += sw * (0.75 + rnd() * 0.5)) jt += `M${f1(x)} ${f1(y0 + 2)}V${f1(y1 - 2)}`;
    }
    for (let x = 20 + rnd() * 40; x < L; x += (wide ? 150 : 90) * K * (0.85 + rnd() * 0.3)) dj += `M${f1(x)} ${f1(feet)}V${f1(ft)}`;
    // Lampadaires : jamais pile derrière Casey à l'arrêt, ni sous un texte de diapo (diapo centrée, au repos) ;
    // un banc entre deux lampadaires sur deux
    const rests = key.map(k => k.cz + k.pan), lamps = [];
    const boxes = slides.map(s => {
      const r = s.getBoundingClientRect(), dy = H / 2 - Math.min(r.height, H) / 2 - r.top;
      return [...s.querySelectorAll('.txt h1 > span > span, .txt h2, .txt b, .txt p, .txt a, .txt .who > div')]
        .map(e => e.getBoundingClientRect()).filter(b => b.width && b.bottom + dy > feet - lh - 10 && b.top + dy < feet)
        .map(b => [b.left, b.right, b.bottom + dy]);
    });
    // (les arrêts de Casey sont plus proches que sa largeur : on n'écarte que ses jambes)
    const clash = (x, hw, top) => rests.some(r => Math.abs(x - r) < cw * 0.3 + hw) ||
      boxes.some((bs, i) => bs.some(([l, r, b]) => { const s = x - key[i].pan; return s + hw > l - 10 && s - hw < r + 10 && b + 8 > top; }));
    for (let x = (wide ? 0.3 : 0.12) * W; x < L + 40; x += (wide ? 0.36 : 0.62) * W * (0.85 + rnd() * 0.3)) {
      let k = 0;
      while (k < 120 && clash(x, 0.12 * lh, feet - lh)) { x += 8 * K; k++; }
      if (k < 120) lamps.push(x);
    }
    let deco = lamps.map(x => `<g transform="translate(${f1(x)} ${f1(feet)}) scale(${f1(lh) / 100})">${LAMP}</g>`).join('');
    lamps.forEach((x, i) => {
      if (i % 2 || i + 1 >= lamps.length) return;
      const bx = (x + lamps[i + 1]) / 2;
      if (!clash(bx, 18 * bK, feet - 20 * bK)) deco += `<g transform="translate(${f1(bx)} ${f1(feet)}) scale(${f1(bK * 100) / 100})">${BENCH}</g>`;
    });
    $('.cor').innerHTML = sil(`<rect x="-40" y="${f1(ft)}" width="${f1(L + 80)}" height="${f1(fb - ft)}"/>`) +
      `<path class="jt t" d="${jt}"/><rect class="deck t" x="-40" y="${f1(feet)}" width="${f1(L + 80)}" height="${f1(pt)}"/><path class="dj t" d="${dj}"/>` + deco;
    tick();
  }

  // Diapo courante et avancement vers la suivante (même logique que world.js)
  function state() {
    const vc = innerHeight / 2, cs = slides.map(s => { const r = s.getBoundingClientRect(); return r.top + Math.min(r.height, innerHeight) / 2; });
    const b = cs.findIndex(c => c > vc);
    if (b === -1) return { A: n - 1, B: n - 1, m: 0 };
    if (b === 0) return { A: 0, B: 0, m: 0 };
    return { A: b - 1, B: b, m: clamp((vc - cs[b - 1]) / (cs[b] - cs[b - 1]), 0, 1) };
  }

  function tick() {
    raf = 0;
    const { A, B, m } = state(), e = ease(m), a = at(A), b = at(B);
    const sx = lerp(a.sun.x, b.sun.x, e), sy = lerp(a.sun.y, b.sun.y, e), sr = lerp(a.sun.r, b.sun.r, e);
    disc.setAttribute('cx', f1(sx)); disc.setAttribute('cy', f1(sy)); disc.setAttribute('r', f1(sr));
    syms.forEach((t, i) => {
      if (!t.textContent) return;
      const o = A === B ? +(i === A) : i === A ? clamp(1 - e * 2.4, 0, 1) : i === B ? clamp(e * 2.4 - 1.4, 0, 1) : 0;
      t.style.opacity = o;
      if (!o) return;
      const fs = sr * (t.textContent.length > 1 ? 0.76 : 1.36);
      t.setAttribute('x', f1(sx)); t.setAttribute('y', f1(sy + fs * 0.375)); t.setAttribute('font-size', f1(fs));
    });
    const mx = lerp(a.moon.x, b.moon.x, e), my = lerp(a.moon.y, b.moon.y, e), mr = lerp(a.moon.r, b.moon.r, e);
    moon.setAttribute('cx', f1(mx)); moon.setAttribute('cy', f1(my)); moon.setAttribute('r', f1(mr));
    bite.setAttribute('cx', f1(mx + mr * 0.42)); bite.setAttribute('cy', f1(my - mr * 0.2)); bite.setAttribute('r', f1(mr * 0.86));

    // Reflet sur la mer, sous l'astre le plus haut
    const up = (y, r) => clamp((hz - (y - r)) / (r * 1.2), 0, 1), su = up(sy, sr), mu = up(my, mr);
    const bx = mu > su ? mx : sx, bw = mu > su ? mr * 1.5 : sr;
    rfs.forEach((r, i) => {
      const w = bw * [1.5, 1.1, 0.72, 0.38][i], h = (wide ? 7 : 4) * K;
      r.setAttribute('x', f1(bx - w / 2)); r.setAttribute('y', f1(hz + (wide ? 12 + i * 13 : 6 + i * 6.5) * K));
      r.setAttribute('width', f1(w)); r.setAttribute('height', f1(h)); r.setAttribute('rx', f1(h / 2));
      r.style.opacity = Math.max(su, mu);
    });

    // Travelling : chaque plan glisse à sa vitesse
    const pan = lerp(a.pan, b.pan, e);
    pxs.forEach(g => g.setAttribute('transform', `translate(${f1(-pan * g.dataset.v)} 0)`));
    // Mouettes (vitesse 0,5) : elles bouclent dans leur couloir et s'effacent à ses bords
    const gw = gb[1] - gb[0];
    gws.forEach((g, i) => {
      const u = (((GULLS[i][0] * gw - pan * 0.5) % gw) + gw) % gw;
      g.setAttribute('transform', `translate(${f1(gb[0] + u)} ${f1(lerp(gb[2], gb[3], GULLS[i][1]))})`);
      g.style.opacity = f1(clamp(Math.min(u, gw - u) / (0.12 * gw), 0, 1) * 100) / 100;
    });
    // Ferry : traverse l'horizon selon l'avancée dans toute la page
    const se = d.documentElement, pg = clamp(scrollY / Math.max(1, se.scrollHeight - innerHeight), 0, 1);
    ferry.setAttribute('transform', `translate(${f1(lerp(fx[0], fx[1], pg))} ${f1(hz + 1)}) scale(${f1(fK * 100) / 100})`);

    // Casey : l'emplacement glisse (taille fixe, pour ne pas redimensionner la 3D), la pose suit la diapo.
    // Sa position « monde » (écran + pan) part vers la 3D, qui en tire la marche.
    const cx = lerp(a.cz, b.cz, e), cw = hC * 62 / 90, pi = e < 0.5 ? A : B;
    // (propriété translate, pas transform : l'échelle de l'entrée et l'inclinaison du mot restent centrées sur l'élément)
    slot.style.translate = `${f1(cx - cw / 2)}px ${f1(feet - hC)}px`;
    slot.dataset.x = f1(cx + pan);
    setPose(POSES[Math.min(pi, POSES.length - 1)]);
    // « C'est moi ! » sur la diapo de nuit : à droite de la main qui salue (desktop), au-dessus de la tête (mobile)
    const om = A === B ? +(A === 5) : A === 5 ? clamp(1 - e * 2.4, 0, 1) : B === 5 ? clamp(e * 2.4 - 1.4, 0, 1) : 0;
    moi.style.opacity = om;
    if (om) {
      moi.classList.toggle('up', !wide);
      moi.style.fontSize = f1(clamp(hC * 0.12, 24, 56)) + 'px';
      moi.style.translate = wide ? `${f1(cx + cw * 0.38)}px ${f1(feet - hC * 0.74 - H)}px` : `${f1(Math.max(10, cx - cw * 0.46))}px ${f1(feet - hC * 1.04 - H)}px`;
    }

    // Mobile : le décor pâlit dès que le texte remonte dans sa zone
    let o = 1;
    if (!wide) { // n'importe quel texte (diapo qui part ou qui arrive) qui chevauche la zone du décor
      const zb = H * (Z - 0.01);
      for (const sl of new Set([slides[A], slides[B]])) { const r = sl.querySelector('.txt').getBoundingClientRect(); if (r.top < zb && r.bottom > 0) o = 0.12; }
    }
    layer.style.setProperty('--o', o); slot.style.opacity = o;

    // Desktop : le texte qui défile passe DERRIÈRE la promenade (il est coupé sous la ligne des pieds),
    // au lieu de passer, illisible, sur la façade noire. Sur mobile la promenade est au milieu de l'écran : rien.
    if (wide) { const r = main.getBoundingClientRect(); main.style.clipPath = `inset(0 0 ${f1(Math.max(0, r.bottom - feet))}px 0)`; }
    else if (main.style.clipPath) main.style.clipPath = '';
  }

  const ask = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', layout);
  layout();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout); // l'horizon dépend de la hauteur du titre
  requestAnimationFrame(() => layer.classList.add('on'));
}
