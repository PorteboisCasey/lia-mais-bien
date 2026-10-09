import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/messages.json', import.meta.url), 'utf8'));

// Contact.js se charge sans document (auto-init gardé) : on l'importe avant d'installer le faux.
const Contact = require('../js/contact.js');

test('NUMBER', () => {
  assert.equal(Contact.NUMBER, fixtures.number);
});

for (const c of fixtures.cases) {
  test(`buildMessage : ${c.name}`, () => {
    assert.equal(Contact.buildMessage(c.input), c.message);
  });
  test(`buildUrl : ${c.name}`, () => {
    assert.equal(
      Contact.buildUrl(c.message),
      'https://wa.me/' + fixtures.number + '?text=' + encodeURIComponent(c.message)
    );
  });
}

// --- Faux formulaire écrit à la main (pas de DOM en Node) ---

function makeForm({ role = null, level = null, question = '' } = {}) {
  const listeners = {};
  const mk = (extra) => {
    const l = {};
    return Object.assign({
      addEventListener(type, fn) { (l[type] = l[type] || []).push(fn); },
      fire(type, ev) { (l[type] || []).forEach((fn) => fn(ev)); },
    }, extra);
  };
  const radios = (name, checkedValue, values) =>
    values.map((v) => ({ name, value: v, checked: v === checkedValue, type: 'radio' }));
  const roleRadios = radios('role', role, ['eleve', 'parent']);
  const levelRadios = radios('level', level, ['college', 'lycee']);
  const textarea = mk({ name: 'question', value: question, type: 'textarea' });
  const submit = mk({ type: 'submit', disabled: false });
  // Comme HTMLFormControlsCollection : accès par nom, RadioNodeList avec .value
  const group = (list) => Object.assign(list.slice(), {
    get value() { const c = list.find((r) => r.checked); return c ? c.value : ''; },
  });
  const elements = {
    role: group(roleRadios),
    level: group(levelRadios),
    question: textarea,
  };
  const form = mk({ elements });
  const help = { hidden: true };
  return { form, textarea, help, submit, listeners };
}

function withFakeDocument(help, fn) {
  const events = [];
  const prev = { document: globalThis.document, CustomEvent: globalThis.CustomEvent };
  globalThis.CustomEvent = class { constructor(type) { this.type = type; } };
  globalThis.document = {
    getElementById: (id) => (id === 'question-help' ? help : null),
    querySelector: (sel) => (sel === '#question-help' ? help : null),
    dispatchEvent: (e) => { events.push(e.type); return true; },
    addEventListener() {},
  };
  try { fn(events); } finally {
    globalThis.document = prev.document;
    globalThis.CustomEvent = prev.CustomEvent;
  }
}

test('init : question vide → aide affichée, rien ouvert', () => {
  const { form, help } = makeForm({ question: '   ' });
  withFakeDocument(help, (events) => {
    const opened = [];
    Contact.init(form, { open: (u) => opened.push(u) });
    const ev = { prevented: false, preventDefault() { this.prevented = true; } };
    form.fire('submit', ev);
    assert.equal(help.hidden, false);
    assert.deepEqual(opened, []);
    assert.deepEqual(events, []);
    assert.equal(ev.prevented, true);
  });
});

test('init : question valide → open(url exacte) + un seul question:sent', () => {
  const { form, help } = makeForm({ role: 'parent', level: 'lycee', question: ' Bonjour & merci ' });
  withFakeDocument(help, (events) => {
    const opened = [];
    Contact.init(form, { open: (u) => opened.push(u) });
    form.fire('submit', { preventDefault() {} });
    const msg = 'Bonjour Casey ! Parent · Lycée\nBonjour & merci\n(envoyé depuis le site)';
    assert.deepEqual(opened, ['https://wa.me/33609148090?text=' + encodeURIComponent(msg)]);
    assert.deepEqual(events, ['question:sent']);
  });
});

test('init : un input sur la textarea masque l’aide', () => {
  const { form, textarea, help } = makeForm({ question: '' });
  withFakeDocument(help, () => {
    Contact.init(form, { open() {} });
    form.fire('submit', { preventDefault() {} });
    assert.equal(help.hidden, false);
    textarea.fire('input', {});
    assert.equal(help.hidden, true);
  });
});
