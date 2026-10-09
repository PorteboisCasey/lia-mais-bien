import os
import re
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(__file__))
import make_qr

URL = "https://example.org/x/"


class MakeQrTest(unittest.TestCase):
    def setUp(self):
        self.svg = make_qr.build_svg(URL)

    def test_viewbox_sans_dimensions_fixes(self):
        self.assertRegex(self.svg, r'viewBox="0 0 (\d+) \1"')
        root = self.svg.split(">", 1)[0]
        self.assertNotRegex(root, r'\b(width|height)=')

    def test_encre_et_fond(self):
        self.assertIn("#111", self.svg)
        self.assertRegex(self.svg, r'<rect[^>]*fill="#fff"')

    def test_marge_de_4_modules(self):
        size = int(re.search(r'viewBox="0 0 (\d+)', self.svg).group(1))
        coords = [tuple(map(int, m)) for m in re.findall(r"M(\d+) (\d+)h(\d+)", self.svg)]
        self.assertTrue(coords)
        self.assertEqual(min(x for x, _, _ in coords), 4)
        self.assertEqual(min(y for _, y, _ in coords), 4)
        self.assertEqual(max(y for _, y, _ in coords) + 1, size - 4)
        self.assertEqual(max(x + n for x, _, n in coords), size - 4)

    def test_ecriture_fichier(self):
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "qr.svg")
            make_qr.main([URL, out])
            with open(out, encoding="utf-8") as f:
                self.assertEqual(f.read(), self.svg)


if __name__ == "__main__":
    unittest.main()
