/* Casey, la mascotte riggée (contrat C2, voir AGENTS.md).
   Dépend de gsap, pas de ScrollTrigger.

   Trois couches de transformations, pour que les animations ne se marchent pas dessus :
   - la pose, sur les <g data-part> (et .fore pour l'avant-bras) ;
   - la marche, sur les .swing internes et .casey-bob, pilotée par une phase sinusoïdale ;
   - la fête et l'orientation, sur .casey-jump et .casey-flip. */
(function () {
  var POSES = ['sit', 'idle', 'walk', 'point', 'wave', 'think', 'phone', 'party'];

  // --- Géométrie du rig (coordonnées du #stand de l'affiche) ---------------

  // Bras au repos : épaule S, coude E, main H.
  var ARM = {
    L: { S: [7, 32], E: [3, 39], H: [4, 46.4] },
    R: { S: [24, 33], E: [28, 40], H: [26, 47] }
  };

  function angle(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; }
  function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function norm(d) { while (d > 180) d -= 360; while (d <= -180) d += 360; return d; }

  // Angles (bras, avant-bras) pour amener le coude puis la main vers des points cibles.
  // Seules les directions comptent : les longueurs des segments restent celles du repos.
  function reach(side, elbow, hand) {
    var a = ARM[side];
    var upper = norm(angle(a.S, elbow) - angle(a.S, a.E));
    var len = dist(a.S, a.E), dir = angle(a.S, elbow) * Math.PI / 180;
    var realElbow = [a.S[0] + len * Math.cos(dir), a.S[1] + len * Math.sin(dir)];
    var fore = norm(angle(realElbow, hand) - angle(a.E, a.H) - upper);
    return { upper: upper, fore: fore };
  }

  // Valeurs par défaut de chaque cible animée par les poses.
  var BASE = {
    head: { rotation: 0, y: 0 },
    eyes: { x: 0, y: 0, scaleY: 1 },
    mouth: { scaleX: 1, scaleY: 1 },
    smile: { autoAlpha: 1 },
    open: { autoAlpha: 0 },
    torso: { scaleY: 1 },
    armL: { rotation: 0 }, foreL: { rotation: 0 },
    armR: { rotation: 0 }, foreR: { rotation: 0 },
    legL: { rotation: 0 }, legR: { rotation: 0 },
    footL: { scaleX: 1 },
    tablet: { autoAlpha: 1 },
    laptop: { autoAlpha: 0 },
    phone: { autoAlpha: 0 },
    sparks: { autoAlpha: 0, scale: 0.5 }
  };

  // Chaque pose : bras via points cibles (L/R), le reste en surcharge de BASE.
  var SPEC = {
    idle: {},
    walk: { footL: { scaleX: -1 } },
    sit: {
      L: [[0.5, 37.5], [-1, 43.5]], R: [[27.5, 40.5], [18, 44.5]],
      footL: { scaleX: -1 }, tablet: { autoAlpha: 0 }, laptop: { autoAlpha: 1 },
      head: { rotation: 4, y: 0 }, eyes: { x: -1, y: 1.2, scaleY: 1 }
    },
    point: {
      R: [[31.5, 34], [39, 32.5]],
      head: { rotation: -3, y: 0 }, eyes: { x: 1.5, y: 0, scaleY: 1 }
    },
    wave: {
      R: [[31, 31], [37, 24]],
      head: { rotation: -4, y: 0 }, eyes: { x: 1, y: 0, scaleY: 1 }
    },
    think: {
      R: [[31, 37.5], [25, 30.5]],
      head: { rotation: -5, y: 1.5 }, eyes: { x: -0.6, y: -2.6, scaleY: 1 },
      mouth: { scaleX: 0.55, scaleY: 0.35 }
    },
    phone: {
      R: [[31.5, 40.5], [36, 31.5]], phone: { autoAlpha: 1 },
      head: { rotation: 6, y: 0 }, eyes: { x: 1.4, y: 1, scaleY: 1 }
    },
    party: {
      L: [[0, 27], [-7, 21]], R: [[31, 28], [38, 21]],
      tablet: { autoAlpha: 0 }, head: { rotation: 0, y: -1 },
      eyes: { x: 0, y: 0, scaleY: 0.55 }, smile: { autoAlpha: 0 }, open: { autoAlpha: 1 },
      sparks: { autoAlpha: 1, scale: 1 }
    }
  };

  // Compile SPEC en jeux de propriétés complets, prêts pour gsap.
  var PROPS = {};
  POSES.forEach(function (name) {
    var spec = SPEC[name], out = {};
    Object.keys(BASE).forEach(function (k) { out[k] = Object.assign({}, BASE[k], spec[k]); });
    ['L', 'R'].forEach(function (side) {
      if (!spec[side]) return;
      var r = reach(side, spec[side][0], spec[side][1]);
      out['arm' + side] = { rotation: r.upper };
      out['fore' + side] = { rotation: r.fore };
    });
    PROPS[name] = out;
  });

  // Le téléphone est contre-tourné pour être droit quand le bras est en pose « phone ».
  var phoneTilt = -(PROPS.phone.armR.rotation + PROPS.phone.foreR.rotation);

  var SVG =
    '<svg class="casey" viewBox="-12 -14 62 90" fill="none" stroke="#111" stroke-width="2.2"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<g class="casey-flip"><g class="casey-jump"><g class="casey-bob">' +
    '<g data-part="legL"><g class="swing"><path d="M10 54 V68" stroke-width="4.2"/>' +
      '<g class="foot"><g class="stride"><ellipse cx="7" cy="70.5" rx="6.5" ry="3.4" fill="#111"/></g></g></g></g>' +
    '<g data-part="legR"><g class="swing"><path d="M20 54 V68" stroke-width="4.2"/>' +
      '<ellipse cx="24" cy="70.5" rx="6.5" ry="3.4" fill="#111"/></g></g>' +
    '<g data-part="torso"><rect x="5" y="29" width="20" height="21" rx="3" fill="#FF4D00"/>' +
      '<rect x="5.5" y="48" width="19" height="7" rx="2" fill="#111"/></g>' +
    '<g data-part="head">' +
      '<path d="M1 10 L-7 5 L-2 12 L-9 15 L0 18" fill="#111"/>' +
      '<rect x="0" y="0" width="30" height="28" rx="3" fill="#fff"/>' +
      '<path d="M-1 10 C-1 -6 31 -6 31 10 Z" fill="#FF4D00"/>' +
      '<path d="M22 10 H41 C40 14 31 14 24 13 Z" fill="#111"/>' +
      '<path d="M11 -4 L9 -11 L14 -6 L19 -10 L18 -4" fill="#111"/>' +
      '<rect x="4" y="13" width="9.5" height="7.5" rx="1" fill="#fff"/>' +
      '<rect x="17" y="13" width="9.5" height="7.5" rx="1" fill="#fff"/>' +
      '<path d="M13.5 16 H17"/>' +
      '<g data-part="eyes"><g class="blink">' +
        '<circle cx="10" cy="17" r="1.5" fill="#111" stroke="none"/>' +
        '<circle cx="23" cy="17" r="1.5" fill="#111" stroke="none"/></g></g>' +
      '<g data-part="mouth"><path class="smile" d="M10 24.5 Q16 28.5 22 23.5"/>' +
        '<path class="open" d="M10 23.2 Q16 31 22 22.4 Z" fill="#111"/></g>' +
    '</g>' +
    '<g data-part="laptop"><rect x="-1" y="35" width="19" height="13.5" rx="1.5" fill="#fff"/>' +
      '<circle cx="8.5" cy="41.7" r="1.6" fill="#FF4D00" stroke="none"/>' +
      '<path d="M2 48.5 H22" stroke-width="3"/></g>' +
    '<g data-part="armL"><g class="swing">' +
      '<g class="tablet"><rect x="-6" y="34" width="12" height="18" rx="1.5" fill="#fff" transform="rotate(-12 0 43)"/></g>' +
      '<path d="M7 32 Q4 35 3 39"/>' +
      '<g class="fore"><path d="M3 39 Q3 43 4 46.4"/><circle cx="4" cy="47" r="2.6" fill="#fff"/></g>' +
    '</g></g>' +
    '<g data-part="armR"><g class="swing">' +
      '<path d="M24 33 Q27 36 28 40"/>' +
      '<g class="fore"><path d="M28 40 Q27.5 44 26 47"/>' +
        '<g data-part="phone" transform="translate(26 48) rotate(' + phoneTilt.toFixed(2) + ')">' +
          '<rect x="-3.4" y="-12.5" width="6.8" height="11.5" rx="1.4" fill="#111"/>' +
          '<rect x="-2" y="-11" width="4" height="7" rx="0.6" fill="#FF4D00" stroke="none"/></g>' +
        '<circle cx="26" cy="48" r="2.6" fill="#fff"/></g>' +
    '</g></g>' +
    '<g class="sparks" stroke-width="2.6"><path d="M-6 -4 L-12 -8 M0 -12 L-3 -18 M34 -9 L37 -15 M41 -2 L47 -5"/></g>' +
    '</g></g></g></svg>';

  // Cibles par clé, et pivot (svgOrigin, en coordonnées du rig).
  var PARTS = {
    head: ['[data-part="head"]', '15 29'],
    eyes: ['[data-part="eyes"]', '16.5 17'],
    blink: ['.blink', '16.5 17'],
    mouth: ['[data-part="mouth"]', '16 25'],
    smile: ['.smile'],
    open: ['.open'],
    torso: ['[data-part="torso"]', '15 55'],
    armL: ['[data-part="armL"]', '7 32'],
    swingArmL: ['[data-part="armL"] > .swing', '7 32'],
    foreL: ['[data-part="armL"] .fore', '3 39'],
    armR: ['[data-part="armR"]', '24 33'],
    swingArmR: ['[data-part="armR"] > .swing', '24 33'],
    foreR: ['[data-part="armR"] .fore', '28 40'],
    legL: ['[data-part="legL"]', '10 54'],
    swingLegL: ['[data-part="legL"] > .swing', '10 54'],
    footL: ['[data-part="legL"] .foot', '10 70.5'],
    stride: ['[data-part="legL"] .stride', '10 70.5'],
    legR: ['[data-part="legR"]', '20 54'],
    swingLegR: ['[data-part="legR"] > .swing', '20 54'],
    tablet: ['.tablet'],
    laptop: ['[data-part="laptop"]'],
    phone: ['[data-part="phone"]'],
    sparks: ['.sparks', '17 -6'],
    flip: ['.casey-flip', '17 0'],
    jump: ['.casey-jump'],
    bob: ['.casey-bob']
  };

  // --- État --------------------------------------------------------------

  var svgs = [];
  var T = {};                 // clé → éléments de tous les rigs montés
  Object.keys(PARTS).forEach(function (k) { T[k] = []; });

  var requested = 'idle';     // règle 1
  var facing = 'right';
  var trans = null;           // transition de pose en cours : { tl, onEnd }
  var loop = null;            // boucle de la pose affichée (idle, wave)
  var celebrating = null;     // Promise de la fête en cours
  var deferred = null;        // résolveur du dernier pose() appelé pendant la fête
  var walkSpeed = 0;          // vitesse demandée par walk(), bornée à [0,1]

  // Marche : une phase qui tourne en boucle, une amplitude qui monte et descend en douceur.
  // La phase vit dans son propre objet : un overwrite sur W ne doit pas tuer la boucle.
  var phase = { t: 0 };
  var W = { amp: 0, arms: 1 };
  var walkTl = null;
  var set = {};
  var strideTarget = 1;

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function attr(name, value) {
    svgs.forEach(function (s) {
      if (value === null) s.removeAttribute(name); else s.setAttribute(name, value);
    });
  }

  // --- Poses ---------------------------------------------------------------

  function endTransition() {
    if (!trans) return;
    var t = trans;
    trans = null;
    t.tl.kill();
    t.onEnd();
  }

  function stopLoop() {
    if (loop) { loop.kill(); loop = null; }
  }

  function startLoop(name) {
    stopLoop();
    if (reduced()) return;
    if (name === 'idle') {
      loop = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 1.5, ease: 'sine.inOut' } })
        .to(T.torso, { scaleY: 1.035 }, 0)
        .to(T.head, { y: -0.8 }, 0);
    } else if (name === 'wave') {
      var base = PROPS.wave.foreR.rotation;
      loop = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 0.32, ease: 'sine.inOut' } })
        .to(T.foreR, { rotation: base - 32 }, 0)
        .to(T.head, { rotation: -1 }, 0);
    }
  }

  // Affiche une pose. onEnd est appelé à la fin de la transition, ou dès qu'elle est interrompue.
  function show(name, duration, onEnd) {
    endTransition();
    stopLoop();
    var props = PROPS[name];
    if (!duration) {
      Object.keys(props).forEach(function (k) { gsap.set(T[k], props[k]); });
      startLoop(name);
      onEnd();
      return;
    }
    var tl = gsap.timeline({
      defaults: { duration: duration, ease: 'back.out(1.5)', overwrite: 'auto' },
      onComplete: function () { trans = null; startLoop(name); onEnd(); }
    });
    Object.keys(props).forEach(function (k) { tl.to(T[k], props[k], 0); });
    trans = { tl: tl, onEnd: onEnd };
  }

  // --- Marche --------------------------------------------------------------

  function renderWalk() {
    var th = phase.t * Math.PI * 2, s = Math.sin(th), a = W.amp;
    set.legL(a * 24 * s);
    set.legR(-a * 24 * s);
    set.armL(-a * W.arms * 18 * s);
    set.armR(a * W.arms * 18 * s);
    set.bob(-a * 1.8 * Math.abs(Math.cos(th)));
  }

  function buildWalk() {
    if (walkTl) walkTl.kill();
    set = {
      legL: gsap.quickSetter(T.swingLegL, 'rotation'),
      legR: gsap.quickSetter(T.swingLegR, 'rotation'),
      armL: gsap.quickSetter(T.swingArmL, 'rotation'),
      armR: gsap.quickSetter(T.swingArmR, 'rotation'),
      bob: gsap.quickSetter(T.bob, 'y')
    };
    walkTl = gsap.to(phase, { t: '+=1', duration: 0.7, ease: 'none', repeat: -1, paused: true, onUpdate: renderWalk });
  }

  // Rapproche la marche affichée de l'état voulu : overlay de walk(), ou boucle de la pose « walk ».
  function updateWalk() {
    if (!walkTl) return;
    var arms = (requested === 'idle' || requested === 'walk') && !celebrating ? 1 : 0;
    if (reduced()) {
      gsap.killTweensOf(W);
      strideTarget = 1;
      gsap.set(T.stride, { scaleX: 1, overwrite: true });
      walkTl.pause();
      W.amp = 0;
      W.arms = arms;
      renderWalk();
      return;
    }
    var speed = walkSpeed > 0 ? walkSpeed : (requested === 'walk' && !celebrating ? 0.5 : 0);
    // En marche, le pied gauche (tourné vers l'extérieur au repos) pointe dans le sens de la marche.
    // walk() est appelé à chaque frame de scroll : on ne recrée ce tween que si la cible change.
    var stride = speed > 0 ? -PROPS[requested].footL.scaleX : 1;
    if (stride !== strideTarget) {
      strideTarget = stride;
      gsap.to(T.stride, { scaleX: stride, duration: 0.2, overwrite: true });
    }
    if (speed > 0) {
      if (walkTl.paused()) walkTl.play();
      gsap.to(walkTl, { timeScale: 0.6 + 1.4 * speed, duration: 0.25, overwrite: true });
      gsap.to(W, { amp: 0.55 + 0.45 * speed, arms: arms, duration: 0.3, ease: 'sine.out', overwrite: true });
    } else {
      gsap.to(W, {
        amp: 0, arms: arms, duration: 0.3, ease: 'sine.inOut', overwrite: true,
        onUpdate: renderWalk,
        onComplete: function () { walkTl.pause(); }
      });
    }
  }

  // --- Clignement ----------------------------------------------------------

  function scheduleBlink() {
    gsap.delayedCall(2 + Math.random() * 3.5, function () {
      if (!reduced() && requested !== 'think') {
        gsap.to(T.blink, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.in' });
      }
      scheduleBlink();
    });
  }

  // --- API -----------------------------------------------------------------

  var Casey = {
    POSES: POSES,

    mount: function (el) {
      var existing = el.querySelector('svg.casey');
      if (existing) return existing;
      el.insertAdjacentHTML('beforeend', SVG);
      var svg = el.querySelector('svg.casey');
      Object.keys(PARTS).forEach(function (k) {
        var nodes = svg.querySelectorAll(PARTS[k][0]);
        if (PARTS[k][1]) gsap.set(nodes, { svgOrigin: PARTS[k][1] });
        T[k].push.apply(T[k], nodes);
      });
      var props = PROPS[requested];
      Object.keys(props).forEach(function (k) { gsap.set(svg.querySelectorAll(PARTS[k][0]), props[k]); });
      gsap.set(svg.querySelectorAll('.casey-flip'), { scaleX: facing === 'left' ? -1 : 1 });
      svg.setAttribute('data-pose', requested);
      svg.setAttribute('data-face', facing);
      svg.setAttribute('data-walk-speed', String(walkSpeed));
      if (walkSpeed > 0) svg.setAttribute('data-walking', 'true');
      svgs.push(svg);
      buildWalk();
      updateWalk();
      // La boucle en cours ne connaît pas ce nouveau rig : on la relance.
      if (!trans && !celebrating) startLoop(requested);
      if (svgs.length === 1) scheduleBlink();
      return svg;
    },

    pose: function (name, opts) {
      if (POSES.indexOf(name) === -1) {
        console.warn('Casey.pose : pose inconnue « ' + name + ' »');
        return Promise.resolve();
      }
      var duration = opts && typeof opts.duration === 'number' ? opts.duration : 0.4;
      if (reduced()) duration = 0;
      requested = name;
      attr('data-pose', name);
      return new Promise(function (resolve) {
        if (celebrating) {
          // Règle 5 : la fête continue ; ce pose() sera affiché au retour.
          if (deferred) deferred();
          deferred = resolve;
        } else {
          show(name, duration, resolve);
        }
        updateWalk();
      });
    },

    walk: function (speed) {
      if (reduced()) {
        // Règle 7 : rien ne bouge. On coupe seulement une marche lancée avant le changement de réglage.
        if (walkSpeed > 0) { walkSpeed = 0; attr('data-walking', null); attr('data-walk-speed', '0'); }
        updateWalk();
        return;
      }
      var s = Math.min(1, Math.max(0, Number(speed) || 0));
      s = Math.round(s * 100) / 100;
      if (s === walkSpeed) return;
      walkSpeed = s;
      attr('data-walk-speed', String(s));
      attr('data-walking', s > 0 ? 'true' : null);
      updateWalk();
    },

    face: function (dir) {
      if (dir !== 'left' && dir !== 'right') {
        console.warn('Casey.face : direction inconnue « ' + dir + ' »');
        return;
      }
      if (dir === facing) return;
      facing = dir;
      attr('data-face', dir);
      var scaleX = dir === 'left' ? -1 : 1;
      if (reduced()) gsap.set(T.flip, { scaleX: scaleX, overwrite: true });
      else gsap.to(T.flip, { scaleX: scaleX, duration: 0.22, ease: 'power2.inOut', overwrite: true });
    },

    celebrate: function () {
      if (celebrating) return celebrating;
      var rm = reduced();
      var hop = null;
      celebrating = new Promise(function (resolve) {
        show('party', rm ? 0 : 0.25, function () {});
        if (!rm) {
          hop = gsap.timeline()
            .to(T.jump, { y: -11, duration: 0.24, ease: 'power2.out' })
            .to(T.jump, { y: 0, duration: 0.2, ease: 'power2.in' })
            .to(T.jump, { y: -7, duration: 0.2, ease: 'power2.out' })
            .to(T.jump, { y: 0, duration: 0.18, ease: 'bounce.out' })
            .to(T.sparks, { rotation: 8, duration: 0.12, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0);
        }
        gsap.delayedCall(1.2, function () {
          if (hop) hop.kill();
          gsap.set(T.jump, { y: 0 });
          gsap.set(T.sparks, { rotation: 0 });
          celebrating = null;
          var d = deferred;
          deferred = null;
          // Règle 5 : retour à la pose demandée à ce moment-là.
          show(requested, reduced() ? 0 : 0.4, function () { if (d) d(); resolve(); });
          updateWalk();
        });
      });
      updateWalk();
      return celebrating;
    }
  };

  window.Casey = Casey;
})();
