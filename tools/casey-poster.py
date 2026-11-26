"""Image de départ de Casey : la toile 3D (tools/casey-poster.html) en WebP transparent, intégrée directement dans
ateliers/index.html (attribut src de <img class="poster">), pour qu'elle s'affiche dès la première image de la page.
Usage : uvx --with playwright --with pillow python tools/casey-poster.py   (exige Chrome et une connexion pour Three.js)"""
import base64, functools, http.server, io, pathlib, re, threading
from PIL import Image
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
server.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=server.serve_forever, daemon=True).start()

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True, args=["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    page = browser.new_page(viewport={"width": 1100, "height": 1000}, device_scale_factor=1)
    page.goto(f"http://127.0.0.1:{server.server_address[1]}/tools/casey-poster.html?t3d=5")
    page.wait_for_function("document.querySelector('#slot.is-3d canvas')", timeout=20000)
    page.wait_for_timeout(500)
    png = page.locator('#slot canvas').screenshot(omit_background=True)
    browser.close()

image = Image.open(io.BytesIO(png)).convert('RGBA')
buf = io.BytesIO(); image.save(buf, 'WEBP', quality=80, method=6, alpha_quality=85)
uri = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
page = root / 'ateliers' / 'index.html'
html, n = re.subn(r'(<img class="poster" src=")[^"]*(")', lambda m: m.group(1) + uri + m.group(2), page.read_text())
assert n == 1, 'image de départ introuvable dans index.html'
html = re.sub(r'(<img class="poster" src="[^"]*" alt="" width=")\d+(" height=")\d+', lambda m: f'{m.group(1)}{image.size[0]}{m.group(2)}{image.size[1]}', html)
page.write_text(html)
print(f"✓ image de départ {image.size[0]}×{image.size[1]}, {len(buf.getvalue())} octets ({len(uri)} une fois intégrée) → {page.relative_to(root)}")
