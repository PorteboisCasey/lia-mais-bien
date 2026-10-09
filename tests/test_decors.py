"""Contrats C1 amendé (cartes, décors branchés), C5 (fichiers de décor) et C6 (palette). Stdlib uniquement."""
import pathlib
import re
import unittest
import xml.etree.ElementTree as ET

import test_structure as ts  # réutilise le parseur HTML de C1 (module, donc pas de tests en double)

ROOT = pathlib.Path(__file__).resolve().parent.parent
DECORS = ROOT / "assets" / "decors"
CSS = ROOT / "css" / "sections.css"
IDS = ["hero", "apprendre", "infos", "moi", "faq", "question"]
SIZES = {"haut": ("0 0 1600 220", "1600", "220"), "bas": ("0 0 1600 180", "1600", "180")}
MAX_BYTES = 20 * 1024
SVG_NS = "{http://www.w3.org/2000/svg}"

# Palette C6 (AGENTS.md). Toute modification se fait aux deux endroits dans le même commit.
PALETTE = {
    "#111111", "#ffffff",                                               # encre, papier
    "#cde8f6", "#ddefe3", "#fff3c9", "#e6e1f5", "#f5e6d3", "#fbe1e3",   # aplats de section
    "#ebcfa8", "#c99b6b",                                               # bois clair / foncé
    "#6e9c82", "#9ccb8f",                                               # vert tableau / plante
    "#e9e9ee", "#bfc3cc",                                               # gris clair / moyen
    "#3d4a7a", "#f7c6a3",                                               # bleu nuit / ciel du soir
    "#ff4d00",                                                          # accent
    "#f6b8c8", "#ee8fa8",                                               # cerisier clair / foncé
    "#e8907a",                                                          # tuile, dos de livre rouge
    "#a8c8e8",                                                          # bleu casier, couette, dos de livre
    "#ffd66b",                                                          # lumière : lampe, guirlande, néon
    "#c9bfe8",                                                          # lavande : dos de livre, post-it
}

FORBIDDEN_TAGS = {"text", "image", "filter", "foreignObject", "script", "style", "pattern",
                  "linearGradient", "radialGradient", "use"}
FORBIDDEN_ATTRS = {"href", "opacity", "fill-opacity", "stroke-opacity", "style"}
CLOSED = {"rect", "circle", "ellipse", "polygon"}


def local(name):
    """Nom sans espace de noms : '{ns}tag' → 'tag'."""
    return name.rsplit("}", 1)[-1]


def norm(color):
    c = color.strip().lower()
    if re.fullmatch(r"#[0-9a-f]{3}", c):
        c = "#" + "".join(ch * 2 for ch in c[1:])
    return c


def svg_files():
    return [DECORS / f"{i}-{band}.svg" for i in IDS for band in SIZES]


class CardsTest(unittest.TestCase):
    def test_une_carte_par_section(self):
        sections = [n for n in ts.load().walk() if n.tag == "section"]
        self.assertEqual(len(sections), 6)
        for s in sections:
            kids = s.children
            self.assertEqual(len(kids), 1, f"#{s.attrs.get('id')} : {len(kids)} enfants")
            self.assertEqual(kids[0].tag, "div", f"#{s.attrs.get('id')}")
            self.assertIn("card", kids[0].attrs.get("class", "").split(), f"#{s.attrs.get('id')}")


class CssTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.css = CSS.read_text(encoding="utf-8")

    def test_urls_de_decor_existent(self):
        urls = re.findall(r"url\(\s*['\"]?([^'\")]*assets/decors/[^'\")]+)", self.css)
        self.assertTrue(urls, "aucun décor branché dans sections.css")
        for u in urls:
            self.assertTrue((CSS.parent / u).resolve().is_file(), u)

    def test_chaque_section_branche_ses_deux_bandes(self):
        for i in IDS:
            for band in SIZES:
                self.assertIn(f"assets/decors/{i}-{band}.svg", self.css)

    def test_trame_et_rayons_retires(self):
        self.assertNotIn(".hero-bubble::before", self.css)
        self.assertNotIn("repeating-conic-gradient", self.css)
        self.assertNotIn("radial-gradient(rgb(17 17 17", self.css)
        self.assertNotIn("text-shadow", self.css)


class SvgTest(unittest.TestCase):
    def test_exactement_12_fichiers(self):
        got = sorted(p.name for p in DECORS.glob("*") if p.is_file())
        self.assertEqual(got, sorted(p.name for p in svg_files()))

    def test_fichiers(self):
        for path in svg_files():
            with self.subTest(fichier=path.name):
                self.assertTrue(path.is_file(), "manquant")
                raw = path.read_bytes()
                self.assertLessEqual(len(raw), MAX_BYTES, f"{len(raw)} octets")
                text = raw.decode("utf-8")
                self.assertIsNone(re.search(r"\d\.\d", text), "nombre décimal")
                root = ET.fromstring(raw)
                self.check_root(root, path.stem.rsplit("-", 1)[1])
                self.check_tree(root, inherited_fill=None)

    def check_root(self, root, band):
        view_box, w, h = SIZES[band]
        self.assertEqual(root.tag, SVG_NS + "svg", "racine <svg> avec xmlns SVG")
        self.assertEqual(root.get("viewBox"), view_box)
        self.assertEqual(root.get("width"), w)
        self.assertEqual(root.get("height"), h)

    def check_tree(self, el, inherited_fill):
        tag = local(el.tag)
        self.assertNotIn(tag, FORBIDDEN_TAGS, f"<{tag}> interdit")
        for name, value in el.attrib.items():
            attr = local(name)
            self.assertNotIn(attr, FORBIDDEN_ATTRS, f"attribut {attr} sur <{tag}>")
            self.assertFalse(attr.startswith("on"), f"attribut {attr} sur <{tag}>")
            if attr in ("fill", "stroke"):
                c = norm(value)
                if c != "none":
                    self.assertIn(c, PALETTE, f"{attr}={value!r} sur <{tag}> hors palette C6")
        fill = el.get("fill", inherited_fill)
        closed = tag in CLOSED or (tag == "path" and re.search(r"[zZ]", el.get("d", "")))
        if closed:
            self.assertIsNotNone(fill, f"<{tag}> fermé sans fill explicite")
        for child in el:
            self.check_tree(child, fill if tag == "g" else inherited_fill)


if __name__ == "__main__":
    unittest.main()
