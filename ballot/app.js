/* California congressional map · 2026 */
(async function () {
  const [races, newGJ, oldGJ] = await Promise.all([
    fetch('data/races.json', { cache: 'no-cache' }).then(r => r.json()),
    fetch('data/new_districts.geojson').then(r => r.json()),
    fetch('data/old_districts.geojson').then(r => r.json()),
  ]);
  const D = races.districts;
  document.getElementById('updated').textContent = 'updated ' + races.updated;

  // ---------- rating → category ----------
  const CATS = ['solid-d', 'likely-d', 'lean-d', 'tossup', 'lean-r', 'likely-r', 'solid-r'];
  const CAT_LABEL = { 'solid-d': 'Solid D', 'likely-d': 'Likely D', 'lean-d': 'Lean D', tossup: 'Toss-up', 'lean-r': 'Lean R', 'likely-r': 'Likely R', 'solid-r': 'Solid R', none: 'No data' };
  const css = getComputedStyle(document.documentElement);
  const COLOR = Object.fromEntries([...CATS, 'none'].map(c => [c, css.getPropertyValue('--' + c).trim()]));
  const PARTY_COLOR = { D: COLOR['solid-d'], R: COLOR['solid-r'], I: '#6b6b6b', NPP: '#6b6b6b', G: '#3b7d3b', L: '#b08d00', PF: '#6b6b6b', AIP: '#6b6b6b' };
  const PARTY_NAME = { D: 'Democrat', R: 'Republican', I: 'Independent', NPP: 'No party preference', G: 'Green', L: 'Libertarian', PF: 'Peace and Freedom', AIP: 'American Independent' };

  function normRating(s) {
    if (!s) return null;
    const t = s.toLowerCase().replace(/[^a-z]/g, '');
    if (t.includes('toss')) return 'tossup';
    const p = t.endsWith('d') || t.includes('dem') ? 'd' : t.endsWith('r') || t.includes('rep') ? 'r' : null;
    if (!p) return null;
    if (t.startsWith('solid') || t.startsWith('safe')) return 'solid-' + p;
    if (t.startsWith('likely')) return 'likely-' + p;
    if (t.startsWith('lean') || t.startsWith('tilt')) return 'lean-' + p;
    return null;
  }
  function category(r) {
    const rt = r.ratings || {};
    const c = normRating(rt.cook) || normRating(rt.sabato) || normRating(rt.inside_elections);
    if (c) return c;
    const parties = new Set((r.candidates || []).map(c => c.party));
    if (parties.size === 1 && (parties.has('D') || parties.has('R'))) return 'solid-' + [...parties][0].toLowerCase();
    return 'none';
  }
  function likelyParty(r) {
    if (r.likely_winner) { const c = (r.candidates || []).find(c => c.name === r.likely_winner); if (c) return c.party; }
    const cat = category(r);
    return cat.endsWith('-d') ? 'D' : cat.endsWith('-r') ? 'R' : null;
  }
  function oldParty(r) { return r.old && r.old.length ? r.old[0].party : null; }
  function flipStatus(r) {
    const lp = likelyParty(r), op = oldParty(r);
    if (!lp || !op) return 'unknown';
    if (lp === op) return 'hold-' + lp.toLowerCase();
    return 'gain-' + lp.toLowerCase();
  }
  const FLIP_COLOR = { 'gain-d': COLOR['solid-d'], 'gain-r': COLOR['solid-r'], 'hold-d': COLOR['lean-d'], 'hold-r': COLOR['lean-r'], unknown: COLOR.none };
  const FLIP_LABEL = { 'gain-d': 'Likely D pickup', 'gain-r': 'Likely R pickup', 'hold-d': 'D hold', 'hold-r': 'R hold', unknown: 'Unclear' };

  let mode = 'rating';
  function fillFor(d) {
    const r = D[d];
    if (mode === 'flip') return FLIP_COLOR[flipStatus(r)];
    if (mode === 'margin') { const p = likelyParty(r); return p ? PARTY_COLOR[p] : COLOR.none; }
    return COLOR[category(r)];
  }

  // ---------- map ----------
  const CA_BOUNDS = [[-124.6, 32.3], [-114.0, 42.1]];
  const map = new maplibregl.Map({
    container: 'map', style: 'https://tiles.openfreemap.org/styles/positron',
    bounds: CA_BOUNDS, fitBoundsOptions: { padding: 10 }, minZoom: 4.5, maxZoom: 14,
    attributionControl: { compact: false }, dragRotate: false, pitchWithRotate: false,
  });
  window.caMap = map;
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.touchZoomRotate.disableRotation();

  let selected = null, hovered = null, overlayOn = false;
  const NONE = ['==', ['get', 'DISTRICT'], -1];
  const only = d => ['==', ['get', 'DISTRICT'], d];
  function colorExpr() { const e = ['match', ['get', 'DISTRICT']]; for (let d = 1; d <= 52; d++) e.push(d, fillFor(d)); e.push(COLOR.none); return e; }

  // bounding box of a GeoJSON geometry
  function bboxOf(geom) {
    let w = 180, s = 90, e = -180, n = -90;
    const walk = c => { if (typeof c[0] === 'number') { if (c[0] < w) w = c[0]; if (c[0] > e) e = c[0]; if (c[1] < s) s = c[1]; if (c[1] > n) n = c[1]; } else c.forEach(walk); };
    walk(geom.coordinates); return [[w, s], [e, n]];
  }
  const oldBBox = {}; oldGJ.features.forEach(f => { oldBBox[f.properties.DISTRICT] = bboxOf(f.geometry); });

  // district-number label points; each carries the zoom at which the district is ~48px wide
  const numsGJ = { type: 'FeatureCollection', features: Object.keys(D).map(d => {
    const [w, s, e, n] = D[d].bbox, span = e - w;
    return { type: 'Feature', properties: { d: +d, minzoom: Math.log2(48 * 360 / (512 * span)) }, geometry: { type: 'Point', coordinates: D[d].label } };
  }) };

  const mapReady = new Promise(res => map.on('load', res));
  map.on('load', () => {
    const before = map.getStyle().layers.find(l => l.type === 'symbol').id; // keep basemap place names above our fills
    map.addSource('new', { type: 'geojson', data: newGJ, promoteId: 'DISTRICT' });
    map.addSource('old', { type: 'geojson', data: oldGJ, promoteId: 'DISTRICT' });
    map.addSource('nums', { type: 'geojson', data: numsGJ });
    map.addLayer({ id: 'new-fill', type: 'fill', source: 'new', paint: { 'fill-color': colorExpr(), 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.78, 0.62] } }, before);
    map.addLayer({ id: 'new-line', type: 'line', source: 'new', paint: { 'line-color': '#ffffff', 'line-width': 1.2, 'line-opacity': 0.9 } }, before);
    map.addLayer({ id: 'old-fill', type: 'fill', source: 'old', layout: { visibility: 'none' }, paint: { 'fill-color': '#000', 'fill-opacity': 0 } }, before);
    map.addLayer({ id: 'old-flash', type: 'fill', source: 'old', filter: NONE, paint: { 'fill-color': '#1b1b1f', 'fill-opacity': 0.12 } }, before);
    map.addLayer({ id: 'old-line', type: 'line', source: 'old', layout: { visibility: 'none' }, paint: { 'line-color': '#1b1b1f', 'line-width': 1.6, 'line-dasharray': [3, 2.5], 'line-opacity': 0.9 } }, before);
    map.addLayer({ id: 'old-flash-line', type: 'line', source: 'old', filter: NONE, paint: { 'line-color': '#1b1b1f', 'line-width': 3 } }, before);
    map.addLayer({ id: 'hover-line', type: 'line', source: 'new', filter: NONE, paint: { 'line-color': '#1b1b1f', 'line-width': 1.5 } }, before);
    map.addLayer({ id: 'sel-line', type: 'line', source: 'new', filter: NONE, paint: { 'line-color': '#1b1b1f', 'line-width': 2 } }, before);
    map.addLayer({ id: 'nums', type: 'symbol', source: 'nums', filter: ['<=', ['get', 'minzoom'], map.getZoom()],
      layout: { 'text-field': ['to-string', ['get', 'd']], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-allow-overlap': false, 'text-padding': 4 },
      paint: { 'text-color': '#1b1b1f', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } });
    map.on('zoom', () => map.setFilter('nums', ['<=', ['get', 'minzoom'], map.getZoom()]));

    // hover
    const tip = document.getElementById('tip'), stage = document.querySelector('.stage');
    map.on('mousemove', 'new-fill', e => {
      const d = e.features[0].id;
      if (hovered !== d) {
        if (hovered != null) map.setFeatureState({ source: 'new', id: hovered }, { hover: false });
        hovered = d; map.setFeatureState({ source: 'new', id: d }, { hover: true });
        map.setFilter('hover-line', d === selected ? NONE : only(d));
        map.getCanvas().style.cursor = 'pointer';
      }
      let oldD = null;
      if (overlayOn) { const q = map.queryRenderedFeatures(e.point, { layers: ['old-fill'] }); if (q.length) oldD = q[0].id; }
      tip.innerHTML = tooltipHTML(d, oldD); tip.hidden = false;
      const r = stage.getBoundingClientRect(), x = e.originalEvent.clientX - r.left, y = e.originalEvent.clientY - r.top;
      tip.style.left = Math.min(x + 14, r.width - tip.offsetWidth - 8) + 'px';
      tip.style.top = (y > tip.offsetHeight + 24 ? y - tip.offsetHeight - 14 : y + 18) + 'px';
    });
    map.on('mouseleave', 'new-fill', () => {
      if (hovered != null) map.setFeatureState({ source: 'new', id: hovered }, { hover: false });
      hovered = null; map.setFilter('hover-line', NONE); tip.hidden = true; map.getCanvas().style.cursor = '';
    });
    map.on('click', 'new-fill', e => select(e.features[0].id, false));
  });

  // ---------- helpers ----------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SUFFIX = new Set(['ii', 'iii', 'iv', 'jr', 'jr.', 'sr', 'sr.']), PARTICLE = new Set(['von', 'van', 'de', 'da', 'del', 'della', 'di', 'la', 'le', 'du']);
  function last(n) {
    const t = n.replace(/\(.*?\)/g, '').trim().split(/\s+/);
    while (t.length > 1 && SUFFIX.has(t[t.length - 1].toLowerCase())) t.pop();
    let i = t.length - 1; while (i > 0 && PARTICLE.has(t[i - 1].toLowerCase())) i--;
    return t.slice(i).join(' ');
  }
  function leanParts(s) { if (!s) return null; const m = s.match(/^\s*((?:[DR]\+\d+)|EVEN|Even)/); return m ? { chip: m[1] + ' PVI', full: s, rest: s } : { chip: null, full: s, rest: s }; }
  const pd = p => `<span class="pd ${esc(p)}"></span>`;
  const sw = (c) => `<span class="sw" style="background:${c}"></span>`;
  function matchup(r) {
    const cs = r.candidates || [];
    if (!cs.length) return r.pending ? 'data pending' : 'no candidates listed';
    return cs.map(c => `${esc(last(c.name))} (${esc(c.party)})`).join(' vs ');
  }
  function tooltipHTML(d, oldD) {
    const r = D[d];
    let s = `<b>District ${d}</b> · ${CAT_LABEL[category(r)]}<br>${matchup(r)}`;
    if (mode === 'flip') s += `<br><span class="muted">${FLIP_LABEL[flipStatus(r)]}</span>`;
    if (oldD) { const m = races.old_members[oldD]; s += `<br><span class="muted">2021 map: District ${oldD} · ${esc(m.name)} (${m.party})</span>`; }
    return s;
  }

  // ---------- legend ----------
  const legend = document.getElementById('legend');
  function renderLegend() {
    const counts = {};
    for (const d in D) { const k = mode === 'flip' ? flipStatus(D[d]) : mode === 'margin' ? (likelyParty(D[d]) || 'none') : category(D[d]); counts[k] = (counts[k] || 0) + 1; }
    let rows;
    if (mode === 'flip') rows = ['gain-d', 'hold-d', 'hold-r', 'gain-r', 'unknown'].map(k => [FLIP_COLOR[k], FLIP_LABEL[k], counts[k] || 0]);
    else if (mode === 'margin') rows = ['D', 'R', 'none'].map(k => [k === 'none' ? COLOR.none : PARTY_COLOR[k], k === 'none' ? 'Unclear' : 'Likely ' + PARTY_NAME[k], counts[k] || 0]);
    else rows = [...CATS, 'none'].map(k => [COLOR[k], CAT_LABEL[k], counts[k] || 0]).filter(r => r[2] || r[1] !== 'No data');
    legend.innerHTML = rows.map(([c, l, n]) => `<div class="row">${sw(c)}<span>${l}</span><span class="cnt">${n}</span></div>`).join('') +
      `<div class="row">${overlayOn ? '<span class="sw line"></span><span>2021 district boundaries</span>' : ''}</div>`;
  }

  // ---------- strip ----------
  const strip = document.getElementById('strip');
  function renderStrip() {
    strip.innerHTML = '';
    for (let d = 1; d <= 52; d++) {
      const b = document.createElement('button'); b.style.background = fillFor(d); b.title = `District ${d} · ${matchup(D[d])}`;
      b.className = selected === d ? 'sel' : ''; b.onclick = () => select(d, true); strip.appendChild(b);
    }
  }
  const jump = document.getElementById('jump');
  for (let d = 1; d <= 52; d++) { const o = document.createElement('option'); o.value = d; o.textContent = `District ${d}`; jump.appendChild(o); }
  jump.onchange = () => { if (jump.value) select(+jump.value, true); };

  // ---------- panel ----------
  const panel = document.getElementById('panel-inner');
  function ratingCell(label, v) {
    const k = normRating(v);
    return `<div class="r"><small>${label}</small><b>${k ? sw(COLOR[k]) : ''}${v ? esc(v) : '<span class="empty">—</span>'}</b></div>`;
  }
  function pollsHTML(r) {
    if (!r.polls || !r.polls.length) return '<p class="empty">No public polling found for this district.</p>';
    const names = (r.candidates || []).map(c => c.name);
    return `<table class="polls"><thead><tr><th>Poll</th><th>Dates</th><th style="text-align:right">Result</th></tr></thead><tbody>` +
      r.polls.map(p => {
        const res = Object.entries(p.results || {});
        const bar = res.map(([n, v]) => { const c = (r.candidates || []).find(c => c.name === n || last(c.name) === last(n)); return `<span style="width:${v}%;background:${c ? PARTY_COLOR[c.party] : '#bbb'}"></span>`; }).join('');
        return `<tr><td>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.pollster)}</a>` : esc(p.pollster)}${p.sample ? `<br><small style="color:var(--ink-3)">${esc(p.sample)}</small>` : ''}</td><td>${esc(p.dates || '')}</td><td class="n">${res.map(([n, v]) => `${esc(last(n))} ${v}`).join('<br>')}<div class="poll-bar">${bar}</div></td></tr>`;
      }).join('') + '</tbody></table>';
  }
  function candHTML(c, r) {
    const lw = r.likely_winner && c.name === r.likely_winner;
    return `<div class="cand ${lw ? 'likely' : ''}">
      <div class="cand-head">${pd(c.party)}<span class="name">${esc(c.name)}</span><span class="tag" title="${PARTY_NAME[c.party] || ''}">${esc(c.party)}</span>${c.incumbent ? '<span class="tag">Incumbent</span>' : ''}${lw ? '<span class="tag lw">Likely winner</span>' : ''}${c.primary_pct != null ? `<span class="pct">${Math.round(c.primary_pct * 10) / 10}% in June primary</span>` : ''}</div>
      ${c.bio ? `<p class="bio">${esc(c.bio)}</p>` : ''}
      <details><summary>Platform and links</summary>
        ${c.platform ? `<p class="platform">${esc(c.platform)}</p>` : '<p class="empty">No platform summary available.</p>'}
        <p class="links">${c.website ? `<a href="${esc(c.website)}" target="_blank" rel="noopener">Campaign website</a>` : ''}${c.ballotpedia ? `<a href="${esc(c.ballotpedia)}" target="_blank" rel="noopener">Ballotpedia</a>` : ''}</p>
      </details></div>`;
  }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function renderPanel(d) {
    const r = D[d], cat = category(r), fs = flipStatus(r);
    const old = r.old || [];
    const demo = r.demo, lean = leanParts(r.partisan_lean);
    panel.innerHTML = `
      <button class="close" aria-label="Close" id="close">×</button>
      <h2>District ${d}</h2>
      <div class="kicker"><span class="chip">${sw(COLOR[cat])}${CAT_LABEL[cat]}</span>${lean && lean.chip ? `<span class="chip" title="${esc(lean.full)}">${esc(lean.chip)}</span>` : ''}${fs.startsWith('gain') ? `<span class="chip">${FLIP_LABEL[fs]}</span>` : ''}</div>
      ${lean && lean.rest ? `<p class="lean-note">${esc(lean.rest)}</p>` : ''}
      ${r.summary ? `<p class="summary">${esc(r.summary)}</p>` : r.pending ? '<p class="empty">Race details for this district are still being compiled.</p>' : ''}
      ${r.incumbent ? `<p class="summary" style="margin-top:6px">Incumbent: ${pd(r.incumbent.party)}${esc(r.incumbent.name)}${r.incumbent.note ? ` · ${esc(r.incumbent.note)}` : ''}</p>` : ''}

      <h3>Drawn from 2021 districts</h3>
      <div class="old-list">${old.map(o => `<button data-old="${o.district}" title="Show on map">District ${o.district} <span class="share">${pct(o.share)}</span> · ${pd(o.party)}${esc(o.rep)}</button>`).join('')}</div>

      <h3>Candidates</h3>
      ${(r.candidates || []).length ? r.candidates.map(c => candHTML(c, r)).join('') : '<p class="empty">No candidates listed yet.</p>'}
      ${r.likely_winner_basis ? `<p class="basis">${esc(r.likely_winner_basis)}</p>` : ''}
      <p class="links"><a href="ballot.html#cd=${d}">Full ballot for this district</a></p>

      <h3>Ratings</h3>
      <div class="ratings">${ratingCell('Cook', r.ratings?.cook)}${ratingCell('Sabato', r.ratings?.sabato)}${ratingCell('Inside Elections', r.ratings?.inside_elections)}</div>
      ${r.ratings?.as_of ? `<p class="asof">as of ${esc(r.ratings.as_of)}</p>` : ''}

      <h3>Polls</h3>
      ${pollsHTML(r)}

      ${demo ? `<h3>District</h3><p class="demo">${demo.pop.toLocaleString()} residents · citizen voting-age population ${pct(demo.hsp)} Hispanic, ${pct(demo.wht)} White, ${pct(demo.asn)} Asian, ${pct(demo.blk)} Black</p>` : ''}
      ${(r.sources || []).length ? `<h3>Sources</h3><ul class="sources">${r.sources.map(s => `<li><a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https?:\/\/(www\.)?/, ''))}</a></li>`).join('')}</ul>` : ''}`;
    document.getElementById('close').onclick = () => select(null, false);
    panel.querySelectorAll('[data-old]').forEach(b => b.onclick = () => flashOld(+b.dataset.old));
    panel.parentElement.scrollTop = 0;
  }
  function renderOverview() {
    const groups = {};
    for (const d in D) (groups[category(D[d])] ||= []).push(+d);
    const order = ['tossup', 'lean-d', 'lean-r', 'likely-d', 'likely-r', 'solid-d', 'solid-r', 'none'];
    panel.innerHTML = `<div class="ov"><h2>Where the 52 races stand</h2><p class="lede">Click a district on the map, or pick one below. Toggle the 2021 boundaries to see how the lines moved.</p>` +
      order.filter(k => groups[k]).map(k => `<div class="grp"><h3>${CAT_LABEL[k]} · ${groups[k].length}</h3>` +
        groups[k].sort((a, b) => a - b).map(d => { const r = D[d], fs = flipStatus(r); return `<button class="d" data-d="${d}">${sw(COLOR[k])}<span class="num">CA-${d}</span><span class="who">${matchup(r)}</span>${fs.startsWith('gain') ? `<span class="flip">${FLIP_LABEL[fs]}</span>` : ''}</button>`; }).join('') + '</div>').join('') + '</div>';
    panel.querySelectorAll('[data-d]').forEach(b => b.onclick = () => select(+b.dataset.d, true));
  }

  // ---------- selection ----------
  const bboxOfNew = d => { const [w, s, e, n] = D[d].bbox; return [[w, s], [e, n]]; };
  function select(d, zoom) {
    selected = d;
    mapReady.then(() => { map.setFilter('sel-line', d ? only(d) : NONE); if (hovered === d) map.setFilter('hover-line', NONE); });
    if (d) {
      if (zoom) mapReady.then(() => map.fitBounds(bboxOfNew(d), { padding: 30, maxZoom: 11, duration: 800 }));
      renderPanel(d); history.replaceState(null, '', '#d' + d); jump.value = d;
    } else { renderOverview(); history.replaceState(null, '', ' '); jump.value = ''; }
    strip.querySelectorAll('button').forEach((b, i) => b.classList.toggle('sel', i + 1 === d));
  }
  let flashTimer = null;
  function flashOld(o) {
    if (!overlayOn) { document.getElementById('overlay').checked = true; setOverlay(true); }
    map.setFilter('old-flash', only(o)); map.setFilter('old-flash-line', only(o));
    const [[w1, s1], [e1, n1]] = oldBBox[o], [[w2, s2], [e2, n2]] = bboxOfNew(selected);
    map.fitBounds([[Math.min(w1, w2), Math.min(s1, s2)], [Math.max(e1, e2), Math.max(n1, n2)]], { padding: 30, maxZoom: 11, duration: 800 });
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { map.setFilter('old-flash', NONE); map.setFilter('old-flash-line', NONE); }, 2600);
  }

  // ---------- controls ----------
  function setOverlay(on) {
    overlayOn = on;
    mapReady.then(() => ['old-line', 'old-fill'].forEach(id => map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')));
    renderLegend();
  }
  document.getElementById('overlay').onchange = e => setOverlay(e.target.checked);
  document.getElementById('mode').onchange = e => { mode = e.target.value; mapReady.then(() => map.setPaintProperty('new-fill', 'fill-color', colorExpr())); renderLegend(); renderStrip(); };
  const ovBox = document.getElementById('overlay');
  if (ovBox.checked) setOverlay(true);
  renderLegend(); renderStrip(); renderOverview();
  const m = location.hash.match(/^#d(\d+)$/);
  if (m && D[m[1]]) { select(+m[1], false); mapReady.then(() => map.fitBounds(bboxOfNew(+m[1]), { padding: 30, maxZoom: 11, duration: 0 })); }
})();
