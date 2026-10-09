/* Contrat C3 : formulaire → WhatsApp. Pas de dépendance. */
var Contact = {
  NUMBER: '33609148090',

  buildMessage: function (data) {
    var roles = { eleve: 'Élève', parent: 'Parent' };
    var levels = { college: 'Collège', lycee: 'Lycée' };
    var tags = [roles[data.role], levels[data.level]].filter(Boolean);
    var head = 'Bonjour Casey !' + (tags.length ? ' ' + tags.join(' · ') : '');
    return [head, (data.question || '').trim(), '(envoyé depuis le site)'].join('\n');
  },

  buildUrl: function (message) {
    return 'https://wa.me/' + Contact.NUMBER + '?text=' + encodeURIComponent(message);
  },

  init: function (form, opts) {
    var open = (opts && opts.open) || function (u) {
      return window.open(u, '_blank') || (location.href = u);
    };
    var els = form.elements;
    var help = document.getElementById('question-help');

    // Un RadioNodeList renvoie '' si rien n'est coché : on normalise en null.
    function choice(name) { return (els[name] && els[name].value) || null; }

    els.question.addEventListener('input', function () {
      if (help) help.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var question = (els.question.value || '').trim();
      if (!question) {
        if (help) help.hidden = false;
        return;
      }
      var message = Contact.buildMessage({
        role: choice('role'),
        level: choice('level'),
        question: question
      });
      open(Contact.buildUrl(message));
      document.dispatchEvent(new CustomEvent('question:sent'));
    });
  }
};

if (typeof module !== 'undefined') module.exports = Contact;

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('question-form');
    if (form) Contact.init(form);
  });
}
