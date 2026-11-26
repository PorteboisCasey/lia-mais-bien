"""Génère ateliers/casey-wave.webp : la toile 3D de Casey (tools/casey-poster.html) en image transparente.
Usage : uvx --with playwright --with pillow python tools/casey-poster.py   (exige Chrome et une connexion pour Three.js)"""
import functools, http.server, io, pathlib, threading
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
target = root / 'ateliers' / 'casey-wave.webp'
image.save(target, 'WEBP', quality=82, method=6, alpha_quality=90)
print(f"✓ {target.relative_to(root)} {image.size[0]}×{image.size[1]}, {target.stat().st_size} octets")
