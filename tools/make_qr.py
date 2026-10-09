"""Génère un QR code SVG (correction d'erreur M, marge de 4 modules).

Usage : uvx --with qrcode python tools/make_qr.py <url> <sortie.svg>
"""
import sys

import qrcode
from qrcode.constants import ERROR_CORRECT_M

BORDER = 4


def build_svg(url):
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, border=BORDER)
    qr.add_data(url)
    qr.make(fit=True)
    matrix = qr.get_matrix()  # marge incluse
    size = len(matrix)
    runs = []
    for y, row in enumerate(matrix):
        x = 0
        while x < size:
            if row[x]:
                start = x
                while x < size and row[x]:
                    x += 1
                runs.append(f"M{start} {y}h{x - start}v1h-{x - start}z")
            else:
                x += 1
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
        f'shape-rendering="crispEdges">'
        f'<rect width="{size}" height="{size}" fill="#fff"/>'
        f'<path fill="#111" d="{"".join(runs)}"/></svg>\n'
    )


def main(argv):
    if len(argv) != 2:
        sys.exit("usage : make_qr.py <url> <sortie.svg>")
    url, out = argv
    with open(out, "w", encoding="utf-8") as f:
        f.write(build_svg(url))


if __name__ == "__main__":
    main(sys.argv[1:])
