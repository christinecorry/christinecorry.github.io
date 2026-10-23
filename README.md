# christinecorry.com

One GitHub Pages repo, several small sites under one domain.

| Path | What lives there |
| --- | --- |
| `/` | The plain site: `index.html`, `cv.html`, `styles.css`. No JavaScript. |
| `/sky/` | The star-chart site. Self-contained: its own `styles.css`, `script.js`, `LORE.md`, `tools/`, and `assets/` (logos, pictures, videos). |
| `/assets/` | Shared files both sites use: `headshot-web.jpg`, `favicon.svg`, `documents/*.pdf`. |

Adding something new (a blog, a project page) means adding a folder beside `sky/`, linking it from wherever it belongs on the root `index.html`, and adding it to `sitemap.xml`. The root page does not currently link to `/sky/`; it is reachable by URL only.

## Editing the star chart

Lore text lives in `sky/LORE.md`. After editing it, run `python3 sky/tools/generate_starmap.py` to fold it into `sky/index.html`.

## Preview

```
python3 -m http.server 8765
```

Then open http://localhost:8765/ and http://localhost:8765/sky/. Hard reload (cmd+shift+r) after CSS or JS edits.
