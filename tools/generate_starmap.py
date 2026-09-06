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
NAVS = {   # key: (IAU id, href, label, label offset from figure center)
    "about":  ("UMa", "#about",  "About Me", (0, 10)),
    "writing":("Cyg", "#writing","Writing", (0, 15)),
    "curios": ("Aur", "#curios", "Curiosities", (-60, 80)),
    "cv":     ("Cas", "cv.html", "CV", (0, -35)),
}
NAV_IDS = {v[0] for v in NAVS.values()}
A('<svg class="starmap" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-label="Map of the northern sky: each invented constellation is a section of this site">')
A('<defs>')
A('<g id="st3"><path d="M0 -8 L0 8 M-8 0 L8 0 M-4 -4 L4 4 M-4 4 L4 -4" fill="none"/><circle r="1.7" stroke="none"/></g>')
A('<g id="st2"><path d="M0 -5 L0 5 M-5 0 L5 0" fill="none"/><circle r="1.4" stroke="none"/></g>')
A('<g id="st1"><circle r="1.1" stroke="none"/></g>')
A(f'<clipPath id="discclip"><circle cx="{C:.0f}" cy="{C:.0f}" r="{R_SKY:.0f}"/></clipPath>')
A('</defs>')   # nav label arcs are appended into the sky group later

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


# epithet and one-line lore for the chart's constellations
LORE_ALL = {
 "And": ("Andromeda \u00b7 the princess", "The chained princess, offered to the sea-monster for her mother's boast and rescued by Perseus."),
 "Aqr": ("Aquarius \u00b7 the water-bearer", "Ganymede, cup-bearer of the gods, pouring an eternal stream."),
 "Aql": ("Aquila \u00b7 the eagle", "The eagle of Zeus, bearer of thunderbolts; Altair is its burning eye."),
 "Ari": ("Aries \u00b7 the ram", "The ram of the golden fleece, whose hide sent the Argonauts across the world."),
 "Aur": ("Auriga \u00b7 the charioteer", "The charioteer cradling a she-goat and her kids; bright Capella rides his shoulder."),
 "Boo": ("Bo\u00f6tes \u00b7 the herdsman", "The herdsman driving the bears around the pole; Arcturus is his ancient amber star."),
 "Cam": ("Camelopardalis \u00b7 the giraffe", "A latecomer of 1612, drawn into the dark gap between the bears where few stars shine."),
 "Cnc": ("Cancer \u00b7 the crab", "The crab Hera sent to nip at Heracles, crushed underfoot and pitied into the sky."),
 "CVn": ("Canes Venatici \u00b7 the hunting dogs", "The herdsman's dogs, forever loosed after the great bear."),
 "CMa": ("Canis Major \u00b7 the great dog", "The hunter's great dog; Sirius, brightest of all the fixed stars, burns at its heart."),
 "CMi": ("Canis Minor \u00b7 the lesser dog", "The lesser dog; Procyon rises just before the Dog Star, and is named for it."),
 "Cap": ("Capricornus \u00b7 the sea-goat", "Pan, half fish from diving into the Nile to escape the monster Typhon."),
 "Cep": ("Cepheus \u00b7 the king", "King of Aethiopia, Andromeda's father, standing watch beside his boastful queen."),
 "Cet": ("Cetus \u00b7 the sea-monster", "The monster sent for Andromeda, turned to stone by the Gorgon's severed head."),
 "Com": ("Coma Berenices \u00b7 the queen's hair", "Queen Berenice's locks, offered to the gods for her husband's safe return from war."),
 "CrB": ("Corona Borealis \u00b7 the crown", "Ariadne's wedding crown, flung into the sky by Dionysus."),
 "Crv": ("Corvus \u00b7 the crow", "The crow that dawdled and lied to Apollo, fixed thirsting beside the cup it cannot reach."),
 "Crt": ("Crater \u00b7 the cup", "The cup of Apollo, carried \u2014 and never delivered \u2014 by the crow."),
 "Del": ("Delphinus \u00b7 the dolphin", "The dolphin that carried the singer Arion safely over the sea for the price of one last song."),
 "Col": ("Columba \u00b7 the dove", "The dove sent out from the ark, returning with an olive branch \u2014 or the one the Argonauts loosed to thread the Clashing Rocks."),
 "Dra": ("Draco \u00b7 the dragon", "The dragon Ladon, coiled around the pole, sleepless guardian of the golden apples."),
 "For": ("Fornax \u00b7 the furnace", "Lacaille's little chemist's furnace \u2014 a modern figure with no myth, its faint stars hiding a whole cluster of galaxies."),
 "Equ": ("Equuleus \u00b7 the little horse", "The foal Celeris, a gift to Castor \u2014 the second-smallest figure in the sky."),
 "Eri": ("Eridanus \u00b7 the river", "The river into which Phaethon fell, still burning, from the chariot of the sun."),
 "Gem": ("Gemini \u00b7 the twins", "Castor and Pollux, one mortal and one divine, who refused to be parted."),
 "Her": ("Hercules \u00b7 the hero", "The kneeling hero, club raised, resting between his twelve labours."),
 "Hya": ("Hydra \u00b7 the water-serpent", "The many-headed serpent of Lerna \u2014 the longest constellation in the sky."),
 "Lac": ("Lacerta \u00b7 the lizard", "A small invention of 1687, slipped between the swan and the queen."),
 "Leo": ("Leo \u00b7 the lion", "The Nemean lion of the first labour, whose hide no weapon could pierce."),
 "LMi": ("Leo Minor \u00b7 the lesser lion", "A quiet seventeenth-century filling between the lion and the great bear."),
 "Lep": ("Lepus \u00b7 the hare", "The hare, crouched forever at the hunter's feet."),
 "Lib": ("Libra \u00b7 the scales", "Once the scorpion's claws, later the balance of justice."),
 "Lyn": ("Lynx \u00b7 the lynx", "Named, Hevelius joked, because only the lynx-eyed can trace it."),
 "Lyr": ("Lyra \u00b7 the lyre", "The lyre Hermes strung from a tortoise shell and Orpheus played to charm stones and half-win Eurydice back from the dead. Vega was the pole star twelve thousand years ago, and will be again."),
 "Mon": ("Monoceros \u00b7 the unicorn", "The unicorn, pacing the winter Milky Way between the two dogs."),
 "Oph": ("Ophiuchus \u00b7 the serpent-bearer", "Asclepius the healer, so skilled he could raise the dead \u2014 and was made a star for it."),
 "Ori": ("Orion \u00b7 the hunter", "The boastful hunter, felled by the scorpion; the two are never in the sky together."),
 "Peg": ("Pegasus \u00b7 the winged horse", "Sprung from Medusa's blood; his great square carries the autumn sky."),
 "Per": ("Perseus \u00b7 the hero", "Gorgon's head in hand \u2014 the demon-star Algol still winks within it."),
 "Psc": ("Pisces \u00b7 the fishes", "Aphrodite and Eros, escaped from Typhon as two fishes tied by a ribbon."),
 "PsA": ("Piscis Austrinus \u00b7 the southern fish", "The great fish drinking the stream poured from the water-bearer's urn. Lonely Fomalhaut is its mouth."),
 "Pup": ("Puppis \u00b7 the stern", "The stern of the Argo \u2014 a ship so vast that astronomers broke her into stern, sails, and keel."),
 "Sge": ("Sagitta \u00b7 the arrow", "The arrow \u2014 Eros' dart, or the shaft Heracles loosed at the eagle."),
 "Sgr": ("Sagittarius \u00b7 the archer", "The centaur archer, bow drawn at the scorpion's red heart."),
 "Sco": ("Scorpius \u00b7 the scorpion", "The scorpion that stung Orion; red Antares is its rival heart."),
 "Sct": ("Scutum \u00b7 the shield", "The shield of King Sobieski, raised into the sky in 1684."),
 "Ser": ("Serpens \u00b7 the serpent", "The serpent twined through the healer's hands, emblem of renewal."),
 "Ser1": ("Serpens \u00b7 the serpent's head", "The serpent twined through the healer's hands, emblem of renewal."),
 "Ser2": ("Serpens \u00b7 the serpent's tail", "The serpent twined through the healer's hands, emblem of renewal."),
 "Sex": ("Sextans \u00b7 the sextant", "Hevelius' own instrument, set among the stars he measured with it."),
 "Tau": ("Taurus \u00b7 the bull", "Zeus in white-hided disguise, carrying Europa across the sea; the Pleiades ride its back."),
 "Tri": ("Triangulum \u00b7 the triangle", "A simple delta \u2014 Sicily to some, the mouth of the Nile to others."),
 "UMi": ("Ursa Minor \u00b7 the lesser bear", "Arcas, son of Callisto; Polaris rides the very tip of its tail."),
 "Vir": ("Virgo \u00b7 the maiden", "Astraea, last of the immortals to leave the earth; Spica is the wheat-ear in her hand."),
 "Vul": ("Vulpecula \u00b7 the little fox", "The little fox carrying a goose to the swan \u2014 Hevelius' sly invention."),
 "Aqr2": ("", ""),
}

# real constellation lines (Lyra omitted: the site's lyre stands in its place)
A('<g class="clines" clip-path="url(#discclip)">')
lines = json.load(open(os.path.join(HERE,'data/constellation_lines.json')))
names = json.load(open(os.path.join(HERE,'data/constellation_names.json')))
centroids = {}
for cid, multiline in lines.items():
    if cid in NAV_IDS: continue
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
    nm_epithet, lore = LORE_ALL.get(cid, (names.get(cid, cid), ""))
    attrs = f' data-cid="{cid}" data-name="{nm_epithet or names.get(cid, cid)}"'
    if lore: attrs += f' data-lore="{lore}"'
    A(f'<g class="constel"{attrs}>')
    ds = [' '.join(f"{fmt(x)},{fmt(y)}" for x,y in (project(ra,dec) for ra,dec in seg)) for seg in keep]
    for d in ds:
        A(f'<polyline points="{d}"/>')
    for d in ds:
        A(f'<polyline class="chit" points="{d}"/>')
    A('</g>')
A('</g>')

# constellation names, revealed on zoom
LABEL_NUDGE = {"Dra": (60, -42), "And": (26, 22), "UMi": (-24, 10), "Gem": (-16, 48)}
A('<g class="cnames" clip-path="url(#discclip)">')
for cid,(x,y) in sorted(centroids.items()):
    if cid in NAV_IDS: continue
    dx,dy = LABEL_NUDGE.get(cid,(0,0)); x+=dx; y+=dy
    nm = names.get(cid, cid)
    A(f'<text class="cname" data-cid="{cid}" x="{fmt(x)}" y="{fmt(y)}">{nm}</text>')
A('</g>')

# stars
A('<g class="stars" clip-path="url(#discclip)">')
pulses = 0
with open(os.path.join(HERE,'data/stars_mag5.csv')) as f:
    for row in csv.DictReader(f):
        dec=float(row['dec']); mag=float(row['mag'])
        if dec < DEC_EDGE: continue
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

# ---------- navigation: four real constellations, clickable ----------
for key,(cid,href,label,(ldx,ldy)) in NAVS.items():
    segs = []
    for seg in lines[cid]:
        pts = [project(ra%360, dec) for ra,dec in seg]
        segs.append(pts)
    allp = [p for seg in segs for p in seg]
    xs = [p[0] for p in allp]; ys = [p[1] for p in allp]
    cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    rad = max(math.hypot(x-cx, y-cy) for x,y in allp)
    A(f'<a class="const" href="{href}" data-cx="{cx:.0f}" data-cy="{cy:.0f}">')
    A(f'<circle class="hit" cx="{cx:.0f}" cy="{cy:.0f}" r="{max(60, min(rad+16, 260)):.0f}"/>')
    for seg in segs:
        d = ' '.join(f"{x:.1f},{y:.1f}" for x,y in seg)
        A(f'<polyline class="lines" points="{d}"/>')
    lx, ly = cx + ldx, cy + ldy
    lr = math.hypot(lx - C, ly - C)
    if lr > 415:   # keep labels well inside the disc
        lx, ly = C + (lx - C) * 415 / lr, C + (ly - C) * 415 / lr
    ly = max(240, min(770, ly))   # stay inside the home crop on wide windows
    lx = max(140, min(860, lx))
    print(f"  label {label!r} at ({lx:.0f},{ly:.0f})")
    A(f'<path id="lab-{key}" d="M {lx-95:.0f} {ly+14:.0f} Q {lx:.0f} {ly:.0f} {lx+95:.0f} {ly+14:.0f}" fill="none"/>')
    A(f'<text class="const-label"><textPath href="#lab-{key}" startOffset="50%" text-anchor="middle">{label}</textPath></text>')
    A('</a>')
A('</g>')  # /sky

A('</svg>')

svg = '\n'.join(out)
idx = os.path.join(ROOT,'index.html')
s = open(idx).read()
s2, nsub = re.subn(r'<svg class="starmap".*?</svg>', svg, s, count=1, flags=re.S)
assert nsub==1
open(idx,'w').write(s2)
print(f"injected: {len(svg)//1024} KB of SVG, {svg.count('<use')+svg.count('class=\"dot\"')} stars")
