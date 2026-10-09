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
  var SPEED = 1500;      // px/s de scroll pour une marche à pleine vitesse

  // Ce que Casey pense en arrivant dans chaque section (bulle de ~3 s, une fois par visite).
  var THOUGHTS = {
    hero: 'Salut ! Je te fais visiter ?',
    apprendre: "L'IA, ça se vérifie toujours.",
    infos: "Et c'est moi qui me déplace !",
    moi: 'Enchanté !',
    faq: 'Hmm… bonne question.',
    question: 'À toi ! Écris-moi juste au-dessus.'
  };
  var THOUGHT_TIME = 3; // s

  function poseFor(id) { return POSE[id]; }
  function thoughtFor(id) { return THOUGHTS[id]; }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return 0.5 - Math.cos(Math.PI * t) / 2; }

  // Mesure tout ce dont pathAt a besoin. Les positions sont en px d'écran, le siège en px de document.
  function measure() {
    var h = window.innerHeight;
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
      seat: sr ? { x: sr.left, y: sr.top + window.scrollY } : null,
      scrollMax: scrollMax,
      casey: { w: box.width, h: svg ? box.height : box.width * CASEY_RATIO },
      stops: stops
    };
  }

  // Bornes de la marche dans #stage : de la gauche jusqu'avant #wa-float (desktop : 28 + 64 px + marge).
  function lane(vp) {
    var a = 12, b = vp.w - (vp.desktop ? 104 : BUTTON_ZONE + 8) - vp.casey.w;
    return { a: a, b: Math.max(a, b), y: vp.h - 8 - vp.casey.h };
  }

  // Barre de progression : x suit l'avancée dans la page, de la gauche (haut) à la droite (bas).
  // Sur desktop, le hero est à part : Casey quitte la bulle du titre et saute au début de la bande.
  function pathAt(progress, vp) {
    var p = clamp(progress, 0, 1), L = lane(vp);
    if (!vp.desktop) return { x: lerp(L.a, L.b, p), y: L.y, face: 'right' };
    var s1 = vp.stops[1];
    if (p < s1) {
      var t = p / s1, u = smooth(t);
      var sx = vp.seat ? vp.seat.x : L.a;
      var sy = (vp.seat ? vp.seat.y : vp.h * 0.2) - p * vp.scrollMax - vp.casey.h;
      return { x: lerp(sx, L.a, u), y: lerp(sy, L.y, u) - Math.sin(Math.PI * t) * 60, face: 'left' };
    }
    return { x: lerp(L.a, L.b, (p - s1) / (1 - s1)), y: L.y, face: 'right' };
  }

  // Reduced-motion : une place fixe, au début de la bande.
  function stillAt(vp) {
    var L = lane(vp);
    return { x: L.a, y: L.y };
  }

  // --- Branchement sur la page ---------------------------------------------

  var box, bubble, vp, here, seen = {}, hideCall = null;

  function place(r) {
    here = r;
    // #casey est ancré en bas de l'écran : y relatif au bas, insensible à la barre d'adresse mobile.
    gsap.set(box, { x: r.x, y: r.y - (vp.h - vp.casey.h) });
    if (!bubble.hidden) placeBubble();
  }

  // La bulle suit Casey, du côté où il reste le plus de place avant #wa-float, centrée sur lui en hauteur.
  // Sa largeur s'adapte à cette place : elle ne recouvre ni Casey ni le bouton, et reste dans la bande.
  function placeBubble() {
    var L = lane(vp), gap = 12, cw = vp.casey.w;
    var limit = L.b + cw;                            // bord droit utilisable
    var right = limit - (here.x + cw + gap), left = here.x - gap - 8;
    var toRight = right >= left;
    bubble.style.maxWidth = Math.max(96, Math.min(240, toRight ? right : left)) + 'px';
    var bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    var x = toRight ? here.x + cw + gap : here.x - gap - bw;
    var y = clamp(here.y + (vp.casey.h - bh) / 2, 4, vp.h - 4 - bh);
    bubble.setAttribute('data-side', toRight ? 'right' : 'left');
    gsap.set(bubble, { x: clamp(x, 8, limit - bw), y: y - (vp.h - bh) });
  }

  function think(id, animate) {
    if (seen[id] || !THOUGHTS[id]) return;
    seen[id] = true;
    if (hideCall) hideCall.kill();
    gsap.killTweensOf(bubble);
    bubble.textContent = THOUGHTS[id];
    bubble.hidden = false;
    gsap.set(bubble, { autoAlpha: 1, scale: 1 });
    placeBubble();
    if (animate) gsap.from(bubble, { scale: 0.5, duration: 0.35, ease: 'back.out(3)' });
    hideCall = gsap.delayedCall(THOUGHT_TIME, function () {
      gsap.to(bubble, {
        autoAlpha: 0, duration: animate ? 0.25 : 0,
        onComplete: function () { bubble.hidden = true; }
      });
    });
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
    poseTriggers(function (id) { active = id; setPose(id === 'hero' ? heroPose() : poseFor(id)); think(id, true); });

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
    poseTriggers(function (id) { Casey.pose(poseFor(id)); think(id, false); });
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
    if (!host || !document.getElementById('casey-bubble') || !window.gsap || !window.ScrollTrigger || !window.Casey) return;
    gsap.registerPlugin(ScrollTrigger);
    Casey.mount(host);
    box = host;
    bubble = document.getElementById('casey-bubble');
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

  return { POSES: POSE, poseFor: poseFor, thoughtFor: thoughtFor, pathAt: pathAt, measure: measure };
})();
