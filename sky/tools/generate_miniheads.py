#!/usr/bin/env python3
"""Regenerate the small constellation figures in the page heads
(index.html: About/UMa, Writing/Cyg, Curiosities/Aur; cv.html: Highlights/Cas).
Run: python3 tools/generate_miniheads.py"""
import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
lines = json.load(open(os.path.join(HERE, 'data/constellation_lines.json')))

def mini(cid, w, h):
    segs = lines[cid]
    raw = [p for seg in segs for p in seg]
    ras = [ra % 360 for ra, dec in raw]
    wrap = (max(ras) - min(ras)) > 180   # constellation straddles RA 0h
    def unw(ra):
        ra = ra % 360
        return ra + 360 if (wrap and ra < 180) else ra
    pts = [(unw(ra), dec) for ra, dec in raw]
    ra0, ra1 = min(p[0] for p in pts), max(p[0] for p in pts)
    d0, d1 = min(p[1] for p in pts), max(p[1] for p in pts)
    pad = 8
    def P(ra, dec):
        x = pad + (ra1 - unw(ra)) / (ra1 - ra0 + 1e-9) * (w - 2*pad)
        y = pad + (d1 - dec) / (d1 - d0 + 1e-9) * (h - 2*pad)
        return f"{x:.1f},{y:.1f}"
    out = [f'<svg class="mini-const" viewBox="0 0 {w} {h}" aria-hidden="true">']
    for seg in segs:
        out.append(f'<polyline points="{" ".join(P(ra,dec) for ra,dec in seg)}"/>')
    for seg in segs:
        for ra, dec in seg:
            x, y = P(ra, dec).split(',')
            out.append(f'<circle cx="{x}" cy="{y}" r="1.6"/>')
    out.append('</svg>')
    return ''.join(out)

HEADS = {"About": ("UMa",170,88), "Writing": ("Cyg",150,96),
         "Curiosities": ("Aur",120,96), "Highlights": ("Cas",150,72)}
for path, titles in [("index.html", ["About","Writing","Curiosities"]), ("cv.html", ["Highlights"])]:
    p = os.path.join(ROOT, path); s = open(p).read()
    for t in titles:
        cid, w, h = HEADS[t]
        anchor = s.index('<div><h2>' + t + '</h2>')
        start = s.rindex('<svg class="mini-const"', 0, anchor)
        end = s.index('</svg>', start) + len('</svg>')
        assert anchor - end < 40, (path, t)   # svg must sit right before the title
        s = s[:start] + mini(cid, w, h) + s[end:]
    open(p, 'w').write(s)
print('miniheads regenerated')
