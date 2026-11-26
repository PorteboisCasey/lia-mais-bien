"""Régénère le lien Google Fonts de ateliers/index.html, réduit aux seuls caractères affichés
dans chaque police (Anton : mot barré, titres h2, numéros d'étapes, symboles du soleil ;
Caveat Brush : .simple, .h et la bulle « C'est moi ! » du décor).
Usage : python3 ateliers/fonts.py [fichier.html]"""
import re, urllib.parse, pathlib
import sys
p = pathlib.Path(__file__).with_name(sys.argv[1] if len(sys.argv) > 1 else 'index.html')
s = p.read_text()
strip = lambda h: re.sub(r'<[^>]+>', '', h)
anton = ''.join(re.findall(r'<span class="word">(.*?)<svg', s)) + ''.join(strip(x) for x in re.findall(r'<h2>(.*?)</h2>', s)) + ''.join(strip(x) for x in re.findall(r'<div class="run">(.*?)</div>', s)) + ''.join(strip(x) for x in re.findall(r'<b>(.*?)</b>', s)) + ''.join(re.findall(r'data-bg="([^"]*)"', s)) + '0123456789CASEYVOUS'
hand = ''.join(re.findall(r'class="(?:simple|h)">(.*?)</span>', s)) + "C'est moi \u00a0!"  # bulle du décor (soleil.js)
q = lambda t: urllib.parse.quote(''.join(sorted(set(t))), safe='')
url = ('https://fonts.googleapis.com/css2?family=Anton&family=Caveat+Brush&display=swap&text=' + q(anton + hand))
s = re.sub(r'(<link rel="stylesheet" href=")[^"]*(")', lambda m: m.group(1) + url.replace('&', '&amp;') + m.group(2), s)
p.write_text(s)
print('Anton :', ''.join(sorted(set(anton))))
print('Caveat :', ''.join(sorted(set(hand))))
