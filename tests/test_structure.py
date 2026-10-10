"""Contrat C1 : structure de index.html (stdlib uniquement)."""
import pathlib
import unittest
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
SECTIONS = [
    ("hero", "sit"), ("apprendre", "point"), ("infos", "idle"),
    ("moi", "wave"), ("faq", "think"), ("question", "phone"),
]
ANIMS = {"words", "draw", "drop", "pop", "shine", "hint"}
SCRIPTS = [
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
    "js/casey.js",
    "js/contact.js",
    "js/choreo.js",
]
# Mesure d'audience (« Finitions » d'AGENTS.md) : GoatCounter, sans cookies, en async et en dernier.
COUNTER = "https://gc.zgo.at/count.js"
COUNTER_ENDPOINT = "https://czs75izi.goatcounter.com/count"
VOID = {"meta", "link", "br", "img", "input", "hr", "path", "circle", "rect",
        "ellipse", "polygon", "use", "stop", "source"}


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []
        self.in_head = False

    def walk(self):
        yield self
        for c in self.children:
            yield from c.walk()

    def ancestors(self):
        n = self.parent
        while n:
            yield n
            n = n.parent


class Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", [], None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n and n.tag != tag:
            n = n.parent
        if n and n.parent:
            self.cur = n.parent


def load():
    b = Builder()
    b.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    return b.root


class StructureTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = load()
        cls.all = list(cls.root.walk())

    def find(self, tag=None, **attrs):
        return [n for n in self.all
                if (tag is None or n.tag == tag)
                and all(n.attrs.get(k) == v for k, v in attrs.items())]

    def one(self, tag=None, **attrs):
        r = self.find(tag, **attrs)
        self.assertEqual(len(r), 1, f"attendu 1 {tag} {attrs}, trouvé {len(r)}")
        return r[0]

    def test_lang_et_viewport(self):
        self.assertEqual(self.one("html").attrs.get("lang"), "fr")
        vp = [n for n in self.find("meta") if n.attrs.get("name") == "viewport"]
        self.assertEqual(len(vp), 1)
        self.assertIn("width=device-width", vp[0].attrs.get("content", ""))

    def test_sections_ordre_et_poses(self):
        got = [(n.attrs.get("id"), n.attrs.get("data-pose")) for n in self.find("section")]
        self.assertEqual(got, SECTIONS)

    def test_data_anim(self):
        vals = {n.attrs["data-anim"] for n in self.all if "data-anim" in n.attrs}
        self.assertEqual(vals, ANIMS)

    def test_data_anim_cibles(self):
        for n in self.all:
            if n.attrs.get("data-anim") == "draw":
                self.assertEqual(n.tag, "path", "draw doit cibler un <path>")
        drops = [n for n in self.all if n.attrs.get("data-anim") == "drop"]
        self.assertEqual(len(drops), 3)
        words = [n for n in self.all if n.attrs.get("data-anim") == "words"]
        self.assertEqual(len(words), 1)
        self.assertEqual(words[0].tag, "h1")
        spans = [c for c in words[0].walk() if c.tag == "span" and "w" in c.attrs.get("class", "").split()]
        self.assertGreaterEqual(len(spans), 6)

    def test_mascotte_et_scene(self):
        casey = self.one(id="casey")
        self.assertEqual(casey.tag, "div")
        self.assertEqual(casey.attrs.get("aria-hidden"), "true")
        self.assertEqual(casey.parent.tag, "body")
        stage = self.one(id="stage")
        self.assertEqual(stage.tag, "div")
        self.assertEqual(stage.attrs.get("aria-hidden"), "true")
        self.one(id="casey-seat")

    def test_casey_seat_dans_hero(self):
        seat = self.one(id="casey-seat")
        self.assertTrue(any(a.attrs.get("id") == "hero" for a in seat.ancestors()))

    def test_faq(self):
        items = [n for n in self.find("details") if "faq-item" in n.attrs.get("class", "").split()]
        self.assertGreaterEqual(len(items), 5)
        for d in items:
            tags = [c.tag for c in d.children]
            self.assertEqual(tags, ["summary", "div"])
            self.assertTrue(any(a.attrs.get("id") == "faq" for a in d.ancestors()))

    def test_formulaire(self):
        form = self.one("form", id="question-form")
        self.assertIn("novalidate", form.attrs)
        inputs = [n for n in form.walk() if n.tag == "input"]
        self.assertEqual(sorted(i.attrs["value"] for i in inputs if i.attrs.get("name") == "role"),
                         ["eleve", "parent"])
        self.assertEqual(sorted(i.attrs["value"] for i in inputs if i.attrs.get("name") == "level"),
                         ["college", "lycee"])
        for i in inputs:
            self.assertEqual(i.attrs.get("type"), "radio")
        ta = [n for n in form.walk() if n.tag == "textarea"]
        self.assertEqual([t.attrs.get("name") for t in ta], ["question"])
        btn = [n for n in form.walk() if n.tag == "button" and n.attrs.get("type") == "submit"]
        self.assertEqual(len(btn), 1)
        for n in form.walk():
            self.assertNotIn("required", n.attrs)
            self.assertNotIn("disabled", n.attrs)
        help_ = self.one("p", id="question-help")
        self.assertIn("hidden", help_.attrs)
        self.assertTrue(any(a is form for a in help_.ancestors()))

    def test_bouton_flottant(self):
        wa = self.one("a", id="wa-float")
        self.assertEqual(wa.attrs.get("href"), "#question")

    def test_scripts(self):
        scripts = [n for n in self.find("script") if n.attrs.get("src")]
        self.assertEqual([s.attrs["src"] for s in scripts], SCRIPTS + [COUNTER])
        counter = scripts.pop()
        self.assertIn("async", counter.attrs)
        self.assertEqual(counter.attrs.get("data-goatcounter"), COUNTER_ENDPOINT)
        for s in scripts:
            self.assertIn("defer", s.attrs)
            self.assertTrue(any(a.tag == "head" for a in s.ancestors()), "scripts en <head>")
        head = self.one("head")
        last = [c for c in head.children if c.tag != "script"]
        first_script = next(i for i, c in enumerate(head.children) if c.tag == "script")
        self.assertTrue(all(c.tag == "script" for c in head.children[first_script:]),
                        "les scripts sont en fin de <head>")
        self.assertTrue(last)

    def test_h1_jamais_masque(self):
        h1 = self.one("h1")
        style = (h1.attrs.get("style") or "").replace(" ", "").lower()
        for bad in ("opacity:0", "display:none", "visibility:hidden"):
            self.assertNotIn(bad, style)
        self.assertNotIn("hidden", h1.attrs)
        for n in h1.walk():
            s = (n.attrs.get("style") or "").replace(" ", "").lower()
            self.assertNotIn("opacity:0", s)

    def test_tel_cliquable(self):
        links = [n for n in self.find("a") if n.attrs.get("href") == "tel:+33609148090"]
        self.assertGreaterEqual(len(links), 1)


if __name__ == "__main__":
    unittest.main()
