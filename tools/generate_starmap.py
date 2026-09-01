#!/usr/bin/env python3
"""Generate the homepage planisphere: a real northern sky chart in the site's
engraved style, injected into index.html between the <svg class="starmap"> tags.

North-polar azimuthal equidistant projection, Polaris at center, rim at dec -30.
Data: tools/data/stars_mag5.csv (HYG v41, mag<=5), constellation_lines.json /
constellation_names.json (IAU, via d3-celestial). Regenerate with:
    python3 tools/generate_starmap.py
"""
import csv, json, math, random, re, os

random.seed(11)
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

C = 500.0          # center of 1000x1000 viewBox
DEC_EDGE = -30.0   # southern limit of the chart
R_SKY = 452.0      # radius at DEC_EDGE

def project(ra_deg, dec):
    r = R_SKY * (90.0 - dec) / (90.0 - DEC_EDGE)
    th = math.radians(ra_deg)
    return C - r * math.sin(th), C - r * math.cos(th)

def fmt(x): return f"{x:.1f}"

out = []
A = out.append

# ---------- defs ----------
NAVS = {   # key: (ra_hours, dec, href, label)
    "about":  (9.6, 41.0, "#about",  "About Me"),
    "writing":(22.4, 32.0, "#writing","Writing"),
    "curios": (18.6156, 38.784, "#curios", "Curiosities"),   # Vega
    "cv":     (2.55, 27.0, "cv.html", "CV"),
}
A('<svg class="starmap" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-label="Map of the northern sky: each invented constellation is a section of this site">')
A('<defs>')
A('<g id="st3"><path d="M0 -8 L0 8 M-8 0 L8 0 M-4 -4 L4 4 M-4 4 L4 -4" fill="none"/><circle r="1.7" stroke="none"/></g>')
A('<g id="st2"><path d="M0 -5 L0 5 M-5 0 L5 0" fill="none"/><circle r="1.4" stroke="none"/></g>')
A('<g id="st1"><circle r="1.1" stroke="none"/></g>')
A(f'<clipPath id="discclip"><circle cx="{C:.0f}" cy="{C:.0f}" r="{R_SKY:.0f}"/></clipPath>')
for key,(rah,dec,href,label) in NAVS.items():
    x,y = project(rah*15, dec)
    A(f'<path id="lab-{key}" d="M {x-85:.0f} {y+72:.0f} Q {x:.0f} {y+56:.0f} {x+85:.0f} {y+72:.0f}" fill="none"/>')
A('</defs>')

# ---------- pannable sky ----------
A('<g id="sky">')
A(f'<circle class="disc" cx="{C:.0f}" cy="{C:.0f}" r="470"/>')
A(f'<circle class="disc-edge" cx="{C:.0f}" cy="{C:.0f}" r="471.5"/>')
A(f'<circle class="disc-edge" cx="{C:.0f}" cy="{C:.0f}" r="475"/>')
A(f'<circle class="rim" cx="{C:.0f}" cy="{C:.0f}" r="{R_SKY:.0f}"/>')
# sawtooth rim ring
pts=[]
for i in range(96):
    th = math.radians(i*360/96)
    r = 454.0 if i%2 else 464.5
    pts.append(f"{C + r*math.sin(th):.1f},{C - r*math.cos(th):.1f}")
A('<polygon class="rim" points="' + ' '.join(pts) + '"/>')

# graticule: declination circles + hour lines + rim ticks/numerals
A('<g class="grid">')
for dec in (60, 30, 0):
    r = R_SKY*(90-dec)/120
    A(f'<circle cx="{C:.0f}" cy="{C:.0f}" r="{r:.1f}"/>')
for h in range(0,24,2):
    x1,y1 = project(h*15, 84.5); x2,y2 = project(h*15, DEC_EDGE)
    A(f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" x2="{fmt(x2)}" y2="{fmt(y2)}"/>')
for h in range(24):
    x1,y1 = project(h*15, DEC_EDGE+2.6); x2,y2 = project(h*15, DEC_EDGE)
    A(f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" x2="{fmt(x2)}" y2="{fmt(y2)}"/>')
A('</g>')
ROMAN=["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII",
       "XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII"]
for h in range(0,24,2):
    ang = h*15
    x,y = project(ang, DEC_EDGE+6.5)
    A(f'<text class="rim-num" x="{fmt(x)}" y="{fmt(y)}" transform="rotate({-ang} {fmt(x)} {fmt(y)})">{ROMAN[h]}</text>')

# ecliptic
eps = math.radians(23.4367)
pts=[]
for lam in range(0,361,3):
    l = math.radians(lam)
    dec = math.degrees(math.asin(math.sin(eps)*math.sin(l)))
    ra  = math.degrees(math.atan2(math.cos(eps)*math.sin(l), math.cos(l))) % 360
    x,y = project(ra, dec)
    pts.append(f"{x:.1f},{y:.1f}")
A('<polyline class="ecliptic" clip-path="url(#discclip)" points="' + ' '.join(pts) + '"/>')

# milky way stipple from galactic latitude
A('<g class="milkyway" clip-path="url(#discclip)">')
NGP_RA, NGP_DEC = math.radians(192.85948), math.radians(27.12825)
n=0; tries=0
while n<650 and tries<200000:
    tries+=1
    ra = random.uniform(0,360)
    dec = math.degrees(math.asin(random.uniform(math.sin(math.radians(DEC_EDGE-2)),1)))
    d = math.radians(dec); a = math.radians(ra)
    b = math.degrees(math.asin(math.sin(d)*math.sin(NGP_DEC)+math.cos(d)*math.cos(NGP_DEC)*math.cos(a-NGP_RA)))
    if random.random() < 0.92*math.exp(-(b/8.5)**2):
        x,y = project(ra,dec)
        A(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{random.uniform(0.4,0.95):.2f}" opacity="{random.uniform(0.14,0.5):.2f}"/>')
        n+=1
A('</g>')

# real constellation lines (Lyra omitted: the site's lyre stands in its place)
A('<g class="clines" clip-path="url(#discclip)">')
lines = json.load(open(os.path.join(HERE,'data/constellation_lines.json')))
names = json.load(open(os.path.join(HERE,'data/constellation_names.json')))
centroids = {}
for cid, multiline in lines.items():
    if cid == "Lyr": continue
    keep=[]
    for seg in multiline:
        pts=[(ra%360, dec) for ra,dec in seg]
        if all(dec > DEC_EDGE-6 for _,dec in pts):
            keep.append(pts)
    if not keep: continue
    allpts=[p for seg in keep for p in seg if p[1]>DEC_EDGE]
    if allpts:
        xs=[project(ra,dec) for ra,dec in allpts]
        cx=sum(x for x,_ in xs)/len(xs); cy=sum(y for _,y in xs)/len(xs)
        if math.hypot(cx-C,cy-C) < R_SKY-18:
            centroids[cid]=(cx,cy)
    for seg in keep:
        d=' '.join(f"{fmt(x)},{fmt(y)}" for x,y in (project(ra,dec) for ra,dec in seg))
        A(f'<polyline points="{d}"/>')
A('</g>')

# constellation names, revealed on zoom
A('<g class="cnames" clip-path="url(#discclip)">')
for cid,(x,y) in sorted(centroids.items()):
    nm = names.get(cid, cid)
    A(f'<text class="cname" x="{fmt(x)}" y="{fmt(y)}">{nm}</text>')
A('</g>')

# stars
A('<g class="stars" clip-path="url(#discclip)">')
pulses = 0
with open(os.path.join(HERE,'data/stars_mag5.csv')) as f:
    for row in csv.DictReader(f):
        dec=float(row['dec']); mag=float(row['mag'])
        if dec < DEC_EDGE: continue
        if row['name']=='Vega': continue   # the lyre's bright star stands for Vega
        x,y = project(float(row['ra_h'])*15, dec)
        op = max(0.35, min(1.0, 1.05 - 0.11*(mag+1.5)))
        cls=''
        if 1.2<mag<3 and pulses<9 and random.random()<0.02:
            cls=' class="pulse"'; pulses+=1
        if mag<0.8:   A(f'<use href="#st3" transform="translate({fmt(x)},{fmt(y)})" opacity="{op:.2f}"{cls}/>')
        elif mag<2.2: A(f'<use href="#st2" transform="translate({fmt(x)},{fmt(y)})" opacity="{op:.2f}"{cls}/>')
        elif mag<3.6: A(f'<use href="#st1" transform="translate({fmt(x)},{fmt(y)})" opacity="{op:.2f}"{cls}/>')
        else:         A(f'<circle class="dot" cx="{fmt(x)}" cy="{fmt(y)}" r="0.7" opacity="{op:.2f}"/>')
A('</g>')

# ---------- the four invented constellations (site navigation) ----------
SC = 1.25
def place(x,y,ax,ay): return ax+SC*x, ay+SC*y

def nebula(ax,ay,dx,dy):
    dots=[]
    for _ in range(9):
        dots.append(f'<circle cx="{ax+dx+random.uniform(-6,6):.1f}" cy="{ay+dy+random.uniform(-5,5):.1f}" r="{random.uniform(0.4,0.8):.2f}" opacity="{random.uniform(0.36,0.7):.2f}"/>')
    return '<g class="nebula">'+''.join(dots)+'</g>'

FIGS = {
 "about": dict(hit=78, star_extra=[("st2",(42,-17))],
    planet=True, lines=[], stars=[]),
 "writing": dict(hit=80, planet=False,
    lines=[[(-35,30),(-9,2),(17,-24),(45,-46)],[(5,-36),(17,-24)],[(-21,-8),(-9,2)]],
    stars=[("st3",(-35,30)),("st2",(-9,2)),("st3",(17,-24)),("st2",(45,-46)),("st1",(5,-36)),("st1",(-21,-8)),("st1",(-45,46))]),
 "curios": dict(hit=80, planet=False, shift=(2,-48),
    lines=[[(-2,48),(-18,6),(-26,-38)],[(-2,48),(15,8),(26,-34)],[(-26,-38),(26,-34)],[(-26,-38),(-34,-52)],[(26,-34),(34,-48)]],
    stars=[("st3",(-2,48)),("st1",(-18,6)),("st2",(-26,-38)),("st1",(15,8)),("st2",(26,-34)),("st1",(-34,-52)),("st1",(34,-48))]),
 "cv": dict(hit=62, planet=False,
    lines=[[(-28,-4),(0,-10),(28,-2)],[(-28,-4),(-34,10)],[(28,-2),(34,12)]],
    stars=[("st1",(-28,-4)),("st2",(0,-10)),("st1",(28,-2))]),
}
for key,(rah,dec,href,label) in NAVS.items():
    ax,ay = project(rah*15, dec)
    fig = FIGS[key]
    sx,sy = fig.get("shift",(0,0))
    ax2,ay2 = ax+SC*sx, ay+SC*sy   # figure center after shift (anchor stays on key star)
    A(f'<a class="const" href="{href}" data-cx="{ax:.0f}" data-cy="{ay:.0f}">')
    A(f'<circle class="hit" cx="{ax2:.0f}" cy="{ay2:.0f}" r="{fig["hit"]}"/>')
    A(nebula(ax2,ay2,-46,-40))
    if fig["planet"]:
        A(f'<g class="figure"><circle cx="{ax2:.0f}" cy="{ay2:.0f}" r="{24*SC:.0f}"/>'
          f'<ellipse cx="{ax2:.0f}" cy="{ay2:.0f}" rx="{46*SC:.0f}" ry="{15*SC:.0f}" transform="rotate(-18 {ax2:.0f} {ay2:.0f})"/></g>')
    for seg in fig["lines"]:
        d=' '.join(f"{ax2+SC*x:.1f},{ay2+SC*y:.1f}" for x,y in seg)
        A(f'<polyline class="lines" points="{d}"/>')
    for st,(x,y) in fig["stars"] + fig.get("star_extra",[]):
        A(f'<use href="#{st}" transform="translate({ax2+SC*x:.1f},{ay2+SC*y:.1f})"/>')
    A(f'<text class="const-label"><textPath href="#lab-{key}" startOffset="50%" text-anchor="middle">{label}</textPath></text>')
    A('</a>')
A('</g>')  # /sky

# fixed title overlay
A('<g class="map-title">')
A(f'<text class="map-name" x="{C:.0f}" y="486">Christine Corry</text>')
A(f'<text class="map-tagline" x="{C:.0f}" y="520">a chart of the visible heavens</text>')
A('</g>')
A('</svg>')

svg = '\n'.join(out)
idx = os.path.join(ROOT,'index.html')
s = open(idx).read()
s2, nsub = re.subn(r'<svg class="starmap".*?</svg>', svg, s, count=1, flags=re.S)
assert nsub==1
open(idx,'w').write(s2)
print(f"injected: {len(svg)//1024} KB of SVG, {svg.count('<use')+svg.count('class=\"dot\"')} stars")
