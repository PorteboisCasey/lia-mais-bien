/* Contrat C2 : stub du socle. L'agent 1 le remplace par le vrai rig animé.
   Ici : un SVG statique découpé en 8 membres, et un `pose` qui ne change que `data-pose`. */
(function () {
  var POSES = ['sit', 'idle', 'walk', 'point', 'wave', 'think', 'phone', 'party'];
  var requested = 'idle';
  var mounted = [];

  // Casey de l'affiche (#stand), découpé en membres. Aucun <use> : le SVG est autonome.
  var SVG =
    '<svg class="casey" viewBox="-12 -14 62 90" fill="none" stroke="#111" stroke-width="2.2"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<g data-part="legL"><path d="M10 54 V68" stroke-width="4.2"/><ellipse cx="7" cy="70.5" rx="6.5" ry="3.4" fill="#111"/></g>' +
    '<g data-part="legR"><path d="M20 54 V68" stroke-width="4.2"/><ellipse cx="24" cy="70.5" rx="6.5" ry="3.4" fill="#111"/></g>' +
    '<g data-part="torso"><rect x="5" y="29" width="20" height="21" rx="3" fill="#FF4D00"/>' +
    '<rect x="5.5" y="48" width="19" height="7" rx="2" fill="#111"/></g>' +
    '<g data-part="head">' +
    '<path d="M1 10 L-7 5 L-2 12 L-9 15 L0 18" fill="#111"/>' +
    '<rect x="0" y="0" width="30" height="28" rx="3" fill="#fff"/>' +
    '<path d="M-1 10 C-1 -6 31 -6 31 10 Z" fill="#FF4D00"/>' +
    '<path d="M22 10 H41 C40 14 31 14 24 13 Z" fill="#111"/>' +
    '<path d="M11 -4 L9 -11 L14 -6 L19 -10 L18 -4" fill="#111"/>' +
    '<rect x="4" y="13" width="9.5" height="7.5" rx="1" fill="#fff"/><rect x="17" y="13" width="9.5" height="7.5" rx="1" fill="#fff"/>' +
    '<path d="M13.5 16 H17"/>' +
    '<circle cx="10" cy="17" r="1.5" fill="#111" stroke="none"/><circle cx="23" cy="17" r="1.5" fill="#111" stroke="none"/>' +
    '<path d="M10 24.5 Q16 28.5 22 23.5"/></g>' +
    '<g data-part="armL"><rect x="-6" y="34" width="12" height="18" rx="1.5" fill="#fff" transform="rotate(-12 0 43)"/>' +
    '<path d="M7 32 Q1 39 4 46"/><circle cx="4" cy="47" r="2.6" fill="#fff"/></g>' +
    '<g data-part="armR"><path d="M24 33 Q29 40 26 47"/><circle cx="26" cy="48" r="2.6" fill="#fff"/></g>' +
    '<g data-part="laptop" display="none"></g>' +
    '<g data-part="phone" display="none"></g>' +
    '</svg>';

  var Casey = {
    POSES: POSES,

    mount: function (el) {
      var existing = el.querySelector('svg.casey');
      if (existing) return existing;
      el.insertAdjacentHTML('beforeend', SVG);
      var svg = el.querySelector('svg.casey');
      svg.setAttribute('data-pose', requested);
      mounted.push(svg);
      return svg;
    },

    pose: function (name) {
      if (POSES.indexOf(name) === -1) {
        console.warn('Casey.pose : pose inconnue « ' + name + ' »');
        return Promise.resolve();
      }
      requested = name;
      mounted.forEach(function (svg) { svg.setAttribute('data-pose', name); });
      return Promise.resolve();
    },

    walk: function () {},
    face: function () {},
    celebrate: function () { return Promise.resolve(); }
  };

  window.Casey = Casey;
})();
