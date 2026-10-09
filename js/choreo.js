/* Chorégraphie : Casey marche au rythme du scroll, les sections jouent leur entrée.
   Dépend de gsap, ScrollTrigger et window.Casey (C2). Écoute question:sent (C4).

   Le trajet est une fonction pure, pathAt(progress, vp), calée sur les vraies sections :
   vp.stops[i] est la progression où la section i devient active (son haut au milieu de l'écran),
   la même borne que celle des poses. Sans JS ou sans CDN, la page reste statique et complète. */
var Choreo = (function () {
  var POSE = { hero: 'sit', apprendre: 'point', infos: 'idle', moi: 'wave', faq: 'think', question: 'phone' };
  var IDS = Object.keys(POSE);
  var STAGE = 96;        // hauteur de #stage
  var BUTTON_ZONE = 80;  // zone de #wa-float, à droite de la scène (mobile)
  var CASEY_RATIO = 90 / 62; // viewBox du SVG de casey.js
  var CROSS = 0.12;      // part d'un segment desktop pour sortir en bas, puis autant pour rentrer en haut
  var SPEED = 1500;      // px/s de scroll pour une marche à pleine vitesse

  function poseFor(id) { return POSE[id]; }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return 0.5 - Math.cos(Math.PI * t) / 2; }

  // Mesure tout ce dont pathAt a besoin. Les positions sont en px d'écran, le siège en px de document.
  function measure() {
    var h = window.innerHeight;
    var main = document.querySelector('main').getBoundingClientRect();
    var seat = document.getElementById('casey-seat');
    var svg = document.querySelector('#casey svg');
    var box = (svg || document.getElementById('casey')).getBoundingClientRect();
    var scrollMax = Math.max(1, document.documentElement.scrollHeight - h);
    var stops = [0];
    for (var i = 1; i < IDS.length; i++) {
      var top = document.getElementById(IDS[i]).getBoundingClientRect().top + window.scrollY;
      stops.push(clamp(Math.max(stops[i - 1] + 0.001, (top - h / 2) / scrollMax), 0, 1));
    }
    var sr = seat && seat.getBoundingClientRect();
    return {
      w: document.documentElement.clientWidth,
      h: h,
      desktop: window.matchMedia('(min-width: 1024px)').matches,
      column: { left: main.left, right: main.right },
      seat: sr ? { x: sr.left, y: sr.top + window.scrollY } : null,
      scrollMax: scrollMax,
      casey: { w: box.width, h: svg ? box.height : box.width * CASEY_RATIO },
      stops: stops
    };
  }

  // Desktop : côté de chaque segment. Hero → droite (le siège est à droite de la bulle), puis on alterne :
  // apprendre G, infos D, moi G (à côté de « C'est moi ! »), faq D, question G (loin de #wa-float).
  function side(i) { return i % 2 ? 'L' : 'R'; }

  function gutter(s, vp) {
    var cw = vp.casey.w, a, b;
    if (s === 'L') { a = 16; b = vp.column.left - 16 - cw; }
    else { a = vp.column.right + 16; b = vp.w - 104 - cw; } // 104 : #wa-float (28 + 64) + marge
    if (b < a) b = a = s === 'L' ? Math.max(0, vp.column.left - cw) / 2 : (vp.column.right + vp.w - cw) / 2;
    // Casey marche vers la colonne : de l'extérieur vers l'intérieur.
    return s === 'L' ? { from: a, to: b, face: 'right' } : { from: b, to: a, face: 'left' };
  }

  // Point d'arrivée du segment i (desktop) : là où commence la sortie du segment suivant.
  function endOf(i, vp) {
    var g = gutter(side(i), vp);
    return i === 0 ? { x: g.from, y: vp.h * 0.35 } : { x: g.to, y: vp.h - vp.casey.h - 40 };
  }

  function desktopAt(i, t, p, vp) {
    var ch = vp.casey.h, g = gutter(side(i), vp);
    if (i === 0) {
      // Hero : assis sur le siège (qui remonte avec la page), il saute dans la gouttière droite.
      var sx = vp.seat ? vp.seat.x : g.from;
      var sy = (vp.seat ? vp.seat.y : vp.h * 0.2) - p * vp.scrollMax - ch;
      var e = endOf(0, vp), u = smooth(t);
      return { x: lerp(sx, e.x, u), y: lerp(sy, e.y, u) - Math.sin(Math.PI * t) * 60, face: 'right' };
    }
    var prev = endOf(i - 1, vp), yTop = vp.h * 0.2, yBot = vp.h - ch - 40;
    if (t < CROSS) {                                 // sort par le bas, du côté précédent
      return { x: prev.x, y: lerp(prev.y, vp.h + 10, smooth(t / CROSS)), face: g.face };
    }
    if (t < 2 * CROSS) {                             // rentre par le haut, de l'autre côté
      return { x: g.from, y: lerp(-ch - 10, yTop, smooth((t - CROSS) / CROSS)), face: g.face };
    }
    var u2 = (t - 2 * CROSS) / (1 - 2 * CROSS);    // descend en marchant vers la colonne
    return { x: lerp(g.from, g.to, smooth(u2)), y: lerp(yTop, yBot, u2), face: g.face };
  }

  // Mobile : allers-retours dans #stage, un trajet par section, hors de la zone du bouton.
  function mobileAt(i, t, vp) {
    var a = 12, b = Math.max(a, vp.w - BUTTON_ZONE - vp.casey.w - 8), fwd = i % 2 === 0;
    var u = smooth(t);
    return { x: fwd ? lerp(a, b, u) : lerp(b, a, u), y: vp.h - 8 - vp.casey.h, face: fwd ? 'right' : 'left' };
  }

  // Position (coin haut-gauche de Casey, en px d'écran) et sens de marche pour une progression 0…1.
  function pathAt(progress, vp) {
    var p = clamp(progress, 0, 1), st = vp.stops, i = 0;
    while (i + 1 < st.length && st[i + 1] <= p) i++;
    var a = st[i], b = i + 1 < st.length ? st[i + 1] : 1;
    var t = b > a ? clamp((p - a) / (b - a), 0, 1) : 1;
    return vp.desktop ? desktopAt(i, t, p, vp) : mobileAt(i, t, vp);
  }

  // Reduced-motion : une place fixe, au bas de la gouttière gauche (desktop) ou à gauche de la scène.
  function stillAt(vp) {
    return vp.desktop ? { x: gutter('L', vp).to, y: vp.h - vp.casey.h - 40 } : mobileAt(0, 0, vp);
  }

  // --- Branchement sur la page ---------------------------------------------

  var box, vp;

  function place(r) {
    // #casey est ancré en bas de l'écran : y relatif au bas, insensible à la barre d'adresse mobile.
    gsap.set(box, { x: r.x, y: r.y - (vp.h - vp.casey.h) });
  }

  function poseTriggers(onPose) {
    IDS.forEach(function (id) {
      ScrollTrigger.create({
        trigger: '#' + id, start: 'top center', end: 'bottom center',
        onToggle: function (st) { if (st.isActive) onPose(id); }
      });
    });
  }

  function travel() {
    var proxy = { p: 0 }, stopTimer = null, active = 'hero', shown = null;
    function setPose(name) { if (name !== shown) { shown = name; Casey.pose(name); } }
    // Hero : assis sur la bulle tant que la page n'a pas bougé, puis il salue (spec §3).
    function heroPose() { return window.scrollY < 4 ? 'sit' : 'wave'; }
    function onRefresh() { vp = measure(); place(pathAt(proxy.p, vp)); }

    vp = measure();
    place(pathAt(0, vp));
    poseTriggers(function (id) { active = id; setPose(id === 'hero' ? heroPose() : poseFor(id)); });

    gsap.to(proxy, {
      p: 1, ease: 'none',
      onUpdate: function () { place(pathAt(proxy.p, vp)); },
      scrollTrigger: {
        start: 0, end: 'max', scrub: 0.3,
        onUpdate: function (st) {
          Casey.walk(Math.min(1, Math.abs(st.getVelocity()) / SPEED));
          var f = pathAt(st.progress, vp).face;
          Casey.face(st.direction < 0 ? (f === 'left' ? 'right' : 'left') : f);
          if (active === 'hero') setPose(heroPose());
          clearTimeout(stopTimer);
          stopTimer = setTimeout(function () { Casey.walk(0); }, 300);
        }
      }
    });
    ScrollTrigger.addEventListener('refresh', onRefresh);
    return function () {
      clearTimeout(stopTimer);
      Casey.walk(0);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
    };
  }

  function still() {
    function onRefresh() { vp = measure(); place(stillAt(vp)); }
    onRefresh();
    poseTriggers(function (id) { Casey.pose(poseFor(id)); });
    ScrollTrigger.addEventListener('refresh', onRefresh);
    return function () { ScrollTrigger.removeEventListener('refresh', onRefresh); };
  }

  // Entrées. Les états de départ sont posés ici (gsap.from / gsap.set), jamais en CSS :
  // sans JS, chaque élément est dans son état final.
  function entries() {
    var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

    // words : rebond mot par mot depuis un état visible (le h1 n'est jamais masqué, pour le LCP).
    gsap.from($$('[data-anim="words"] .w'), {
      y: -26, rotation: function () { return gsap.utils.random(-9, 9); },
      duration: 0.7, ease: 'back.out(3)', stagger: 0.07, delay: 0.1
    });

    // Trait ondulé du hero : dévoilé de gauche à droite (clip-path, car il est en non-scaling-stroke).
    gsap.fromTo('#hero .wave', { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, delay: 0.9, ease: 'power2.inOut' });

    // shine : les éclats jaillissent, puis scintillent.
    var shine = document.querySelector('[data-anim="shine"]');
    if (shine) {
      gsap.from(shine, { scale: 0, transformOrigin: '0% 100%', duration: 0.4, delay: 1.4, ease: 'back.out(4)' });
      gsap.timeline({ delay: 2, repeat: -1, repeatDelay: 1.8 })
        .to(shine, { scale: 1.3, rotation: 8, duration: 0.15, ease: 'power1.out' })
        .to(shine, { scale: 1, rotation: 0, duration: 0.35, ease: 'elastic.out(1, 0.4)' });
    }

    // hint : la flèche rebondit, puis la mention disparaît au premier scroll.
    var hint = document.querySelector('[data-anim="hint"]');
    if (hint) {
      var bounce = gsap.to(hint.querySelector('svg'), { y: 8, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      ScrollTrigger.create({
        start: 4, once: true,
        onEnter: function () { bounce.kill(); gsap.to(hint, { autoAlpha: 0, y: 10, duration: 0.3 }); }
      });
    }

    // draw : les coches se tracent l'une après l'autre, liées au scroll.
    var checks = $$('.promises [data-anim="draw"]');
    if (checks.length) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: '.promises', start: 'top 75%', end: 'bottom 45%', scrub: 0.5 } });
      checks.forEach(function (path) {
        var len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(path, { strokeDashoffset: 0, ease: 'none' });
      });
    }

    // drop : les stickers tombent et rebondissent, en finissant sur leur inclinaison (--tilt).
    var stickers = $$('[data-anim="drop"]');
    if (stickers.length) {
      stickers.forEach(function (el) {
        gsap.set(el, { rotation: parseFloat(getComputedStyle(el).getPropertyValue('--tilt')) || 0 });
      });
      gsap.timeline({ scrollTrigger: { trigger: stickers[0].parentNode, start: 'top 80%' } })
        .from(stickers, { y: -160, rotation: '-=14', duration: 0.9, ease: 'bounce.out', stagger: 0.15 }, 0)
        .from(stickers, { autoAlpha: 0, duration: 0.2, stagger: 0.15 }, 0);
    }

    // pop : la bulle « C'est moi ! » apparaît avec un rebond (son inclinaison CSS est conservée).
    var pop = document.querySelector('[data-anim="pop"]');
    if (pop) {
      gsap.from(pop, {
        scale: 0, autoAlpha: 0, duration: 0.6, ease: 'back.out(3)',
        scrollTrigger: { trigger: pop, start: 'top 85%' }
      });
    }
  }

  function boot() {
    var host = document.getElementById('casey');
    if (!host || !window.gsap || !window.ScrollTrigger || !window.Casey) return;
    gsap.registerPlugin(ScrollTrigger);
    Casey.mount(host);
    box = host;
    document.documentElement.classList.add('casey-live'); // masque le Casey statique de #moi

    gsap.matchMedia().add({
      motion: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)'
    }, function (ctx) {
      if (ctx.conditions.reduce) return still();
      entries();
      return travel();
    });

    document.addEventListener('question:sent', function () { Casey.celebrate(); });
  }

  if (typeof document !== 'undefined') boot();

  return { POSES: POSE, poseFor: poseFor, pathAt: pathAt, measure: measure };
})();
