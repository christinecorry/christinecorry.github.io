/* California ballot browser · November 2026 */
(async function () {
  const getJSON = u => fetch(u, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  let B, R;
  try { [B, R] = await Promise.all([getJSON('data/ballot.json'), getJSON('data/races.json')]); }
  catch (err) { document.getElementById('contests').innerHTML = '<p class="empty">Couldn\'t load the election data. Please reload the page.</p>'; return; }
  document.getElementById('updated').textContent = 'updated ' + B.updated;

  // ---------- shared helpers ----------
  const css = getComputedStyle(document.documentElement);
  const PARTY_COLOR = { D: css.getPropertyValue('--solid-d').trim(), R: css.getPropertyValue('--solid-r').trim(), I: '#6b6b6b', NPP: '#6b6b6b', G: '#3b7d3b', L: '#b08d00', PF: '#6b6b6b', AIP: '#6b6b6b' };
  const PARTY_NAME = { D: 'Democrat', R: 'Republican', I: 'Independent', NPP: 'No party preference', G: 'Green', L: 'Libertarian', PF: 'Peace and Freedom', AIP: 'American Independent' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SUFFIX = new Set(['ii', 'iii', 'iv', 'jr', 'jr.', 'sr', 'sr.']), PARTICLE = new Set(['von', 'van', 'de', 'da', 'del', 'della', 'di', 'la', 'le', 'du']);
  function last(n) {
    if (/^(undecided|other|generic|someone|none|refused|don)/i.test(n)) return n;
    const t = n.replace(/\(.*?\)/g, '').trim().split(/\s+/);
    while (t.length > 1 && SUFFIX.has(t[t.length - 1].toLowerCase())) t.pop();
    let i = t.length - 1; while (i > 0 && PARTICLE.has(t[i - 1].toLowerCase())) i--;
    return t.slice(i).join(' ');
  }
  const pd = p => `<span class="pd ${esc(p)}"></span>`;
  const link = (url, label) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>` : '';
  const pct = x => Math.round(x * 10) / 10;

  function candHTML(c, lw) {
    const isLW = lw && c.name === lw;
    return `<div class="cand ${isLW ? 'likely' : ''}">
      <div class="cand-head">${c.party ? pd(c.party) : ''}<span class="name">${esc(c.name)}</span>${c.party ? `<span class="tag" title="${PARTY_NAME[c.party] || ''}">${esc(c.party)}</span>` : ''}${c.incumbent ? '<span class="tag">Incumbent</span>' : ''}${isLW ? '<span class="tag lw">Favored</span>' : ''}${c.primary_pct != null ? `<span class="pct">${pct(c.primary_pct)}% in June primary</span>` : ''}</div>
      ${c.bio ? `<p class="bio">${esc(c.bio)}</p>` : ''}
      ${(c.platform || c.website || c.ballotpedia) ? `<details><summary>Platform and links</summary>
        ${c.platform ? `<p class="platform">${esc(c.platform)}</p>` : ''}
        <p class="links">${link(c.website, 'Campaign website')}${link(c.ballotpedia, 'Ballotpedia')}</p>
      </details>` : ''}</div>`;
  }
  function pollRow(p, cands) {
    const res = Object.entries(p.results || {}).filter(([, v]) => v != null);
    const bar = res.map(([n, v]) => { const c = (cands || []).find(c => c.name === n || last(c.name) === last(n)); const col = c ? PARTY_COLOR[c.party] : n === 'Yes' ? '#3b7d3b' : n === 'No' ? '#8e1c1c' : '#bbb'; return `<span style="width:${v}%;background:${col}"></span>`; }).join('');
    return `<tr><td>${p.url ? link(p.url, esc(p.pollster)) : esc(p.pollster)}${p.sample ? `<br><small style="color:var(--ink-3)">${esc(p.sample)}</small>` : ''}</td><td>${esc(p.dates || '')}</td><td class="n">${res.map(([n, v]) => `${esc(last(n))} ${v}`).join('<br>')}<div class="poll-bar">${bar}</div></td></tr>`;
  }
  function pollsHTML(polls, cands, limit = 4) {
    if (!polls || !polls.length) return '';
    const head = `<thead><tr><th>Poll</th><th>Dates</th><th style="text-align:right">Result</th></tr></thead>`;
    const shown = polls.slice(0, limit), rest = polls.slice(limit);
    let h = `<table class="polls">${head}<tbody>${shown.map(p => pollRow(p, cands)).join('')}</tbody></table>`;
    if (rest.length) h += `<details class="more-polls"><summary>${rest.length} earlier poll${rest.length > 1 ? 's' : ''}</summary><table class="polls"><tbody>${rest.map(p => pollRow(p, cands)).join('')}</tbody></table></details>`;
    return h;
  }
  function ratingsHTML(rt) {
    if (!rt || !(rt.cook || rt.sabato || rt.inside_elections)) return '';
    const cell = (l, v) => `<div class="r"><small>${l}</small><b>${v ? esc(v) : '—'}</b></div>`;
    return `<div class="ratings">${cell('Cook', rt.cook)}${cell('Sabato', rt.sabato)}${cell('Inside Elections', rt.inside_elections)}</div>${rt.as_of ? `<p class="asof">as of ${esc(rt.as_of)}</p>` : ''}`;
  }
  function contestHTML(title, r, opts = {}) {
    if (!r) return `<article class="contest"><h3>${title}</h3><p class="empty">${opts.missing || 'Details for this contest are still being compiled.'}</p></article>`;
    const cands = r.candidates || [];
    return `<article class="contest"${opts.id ? ` id="${opts.id}"` : ''}>
      <h3>${title}${opts.sub ? ` <span class="sub">${opts.sub}</span>` : ''}</h3>
      ${r.summary ? `<p class="summary">${esc(r.summary)}</p>` : ''}
      ${r.incumbent ? `<p class="summary small">Incumbent: ${r.incumbent.party ? pd(r.incumbent.party) : ''}${esc(r.incumbent.name)}${r.incumbent.note ? ` · ${esc(r.incumbent.note)}` : ''}</p>` : ''}
      ${r.partisan_lean ? `<p class="lean-note">${esc(r.partisan_lean)}</p>` : ''}
      ${cands.length ? cands.map(c => candHTML(c, r.likely_winner)).join('') : '<p class="empty">No candidates listed.</p>'}
      ${r.likely_winner_basis ? `<p class="basis">${esc(r.likely_winner_basis)}</p>` : ''}
      ${ratingsHTML(r.ratings)}
      ${pollsHTML(r.polls, cands)}
      ${opts.extra || ''}
    </article>`;
  }
  function propHTML(p) {
    return `<article class="contest prop" id="prop-${p.number}">
      <h3>Proposition ${p.number} <span class="sub">${esc(p.title)}</span></h3>
      <p class="lean-note">${esc(p.type || '')}</p>
      ${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}
      <div class="yesno">${p.yes_means ? `<div><b>Yes</b> ${esc(p.yes_means)}</div>` : ''}${p.no_means ? `<div><b>No</b> ${esc(p.no_means)}</div>` : ''}</div>
      <details><summary>Fiscal impact, supporters and opponents</summary>
        ${p.fiscal_impact ? `<p class="platform">${esc(p.fiscal_impact)}</p>` : ''}
        ${(p.supporters || []).length ? `<p class="platform"><b>For:</b> ${p.supporters.map(esc).join(', ')}${p.money && p.money.for ? ` · ${esc(p.money.for)} raised` : ''}</p>` : ''}
        ${(p.opponents || []).length ? `<p class="platform"><b>Against:</b> ${p.opponents.map(esc).join(', ')}${p.money && p.money.against ? ` · ${esc(p.money.against)} raised` : ''}</p>` : ''}
        ${p.money && (p.money.for || p.money.against) ? `<p class="lean-note">Contributions as reported to the Secretary of State${p.money.as_of ? ` through ${esc(p.money.as_of)}` : ''}; multi-measure committees are not included, so totals understate spending.</p>` : ''}
        <p class="links">${link(p.lao_url, 'LAO analysis')}${link(p.sos_url, 'Official voter guide')}${link(p.ballotpedia, 'Ballotpedia')}</p>
      </details>
      ${pollsHTML(p.polls, [])}
    </article>`;
  }

  // ---------- location state ----------
  const state = { cd: null, sd: null, ad: null, boe: null, county: null, label: null };
  try { Object.assign(state, JSON.parse(localStorage.getItem('ballot-loc') || '{}')); } catch (e) { /* ignore */ }
  const hp = new URLSearchParams(location.hash.slice(1));
  const MAXD = { cd: 52, sd: 40, ad: 80, boe: 4 };
  if ([...hp.keys()].some(k => ['cd', 'sd', 'ad', 'boe', 'county'].includes(k))) {
    state.label = null;
    for (const k of ['cd', 'sd', 'ad', 'boe']) if (hp.has(k)) { const v = +hp.get(k); state[k] = v >= 1 && v <= MAXD[k] ? v : null; }
    if (hp.has('county')) state.county = hp.get('county') || null;
  }
  for (const k of ['cd', 'sd', 'ad', 'boe']) if (state[k] != null && !(state[k] >= 1 && state[k] <= MAXD[k])) state[k] = null;
  state.label = null;
  function save() { try { const { label, ...keep } = state; localStorage.setItem('ballot-loc', JSON.stringify(keep)); } catch (e) { /* ignore */ } const q = new URLSearchParams(); for (const k of ['cd', 'sd', 'ad', 'boe', 'county']) if (state[k]) q.set(k, state[k]); history.replaceState(null, '', location.pathname + location.search + (q.toString() ? '#' + q : '')); }

  // district geometry, loaded on first lookup
  let geo = null;
  async function loadGeo() {
    if (geo) return geo;
    const [cd, sd, ad, boe] = await Promise.all(['new', 'senate', 'assembly', 'boe'].map(n => fetch(`data/${n}_districts.geojson`).then(r => r.json())));
    return (geo = { cd, sd, ad, boe });
  }
  function pointInRing(x, y, ring) { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; }
  function pointInFeature(lng, lat, f) { const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const poly of polys) { if (pointInRing(lng, lat, poly[0])) { let hole = false; for (let k = 1; k < poly.length; k++) if (pointInRing(lng, lat, poly[k])) { hole = true; break; } if (!hole) return true; } } return false; }
  const districtAt = (gj, lng, lat) => { const f = gj.features.find(f => pointInFeature(lng, lat, f)); return f ? f.properties.DISTRICT : null; };

  const COUNTY_NAMES = (B.resources && B.resources.counties || []).map(c => c.name);
  function boeForCounty(county) {
    if (!county || !B.statewide || !B.statewide.boe_districts) return null;
    const hit = B.statewide.boe_districts.find(b => b.counties.some(c => c.toLowerCase() === county.toLowerCase()));
    return hit ? hit.district : null;
  }
  async function locate(lng, lat, label, county) {
    const g = await loadGeo();
    const cd = districtAt(g.cd, lng, lat);
    if (!cd) { setWhere('That point is outside California. Try a street address or ZIP code, or pick your districts below.'); return; }
    state.cd = cd; state.sd = districtAt(g.sd, lng, lat); state.ad = districtAt(g.ad, lng, lat); state.boe = districtAt(g.boe, lng, lat);
    state.county = county || null; state.label = label || null;
    save(); render();
  }
  const whereEl = document.getElementById('where');
  function setWhere(t) { whereEl.textContent = t; }

  // address search (Nominatim)
  // ---------- address search with suggestions (Photon / OpenStreetMap, California only) ----------
  const CA_BBOX = '-124.6,32.3,-114.0,42.1';
  const addrEl = document.getElementById('addr'), acEl = document.getElementById('ac'), findBtn = document.querySelector('#addr-form button[type=submit]');
  let acItems = [], acIndex = -1, acSeq = 0, acTimer = null, acCtl = null;
  const PLACE_TYPES = new Set(['city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood', 'quarter', 'locality', 'municipality']);
  function suggestionFrom(f, prefixNumber) {
    const p = f.properties, [lng, lat] = f.geometry.coordinates;
    const isAddr = !!p.housenumber, isStreet = p.osm_key === 'highway' && !!p.street === false && !!p.name && p.type === 'street';
    const isZip = p.type === 'postcode' || p.osm_value === 'postcode' || (p.osm_key === 'boundary' && p.osm_value === 'postal_code') || (!!p.postcode && !p.name && !p.housenumber && !p.street) || /^\d{5}$/.test(p.name || '');
    const isPlace = (p.osm_key === 'place' && PLACE_TYPES.has(p.osm_value)) || isZip;
    if (!isAddr && !isStreet && !isPlace) return null;
    const place = p.city || p.locality || p.district || p.town || p.village || (isPlace && !isZip ? p.name : null) || p.county;
    let line1 = isAddr ? `${p.housenumber} ${p.street || p.name || ''}`.trim() : isStreet ? (prefixNumber ? `${prefixNumber} ${p.name}` : p.name) : isZip ? p.postcode || p.name : p.name;
    const label = [line1, place && place !== line1 ? place : null].filter(Boolean).join(', ');
    const county = (p.county || '').replace(/ County$/, '') || (place && COUNTY_NAMES.some(n => n.toLowerCase() === String(place).toLowerCase()) ? place : null);
    return { lng, lat, label, county, postcode: p.postcode, rank: isAddr ? 0 : isStreet ? 1 : 2,
      needsCensus: isStreet && !!prefixNumber, query: isStreet && prefixNumber ? `${prefixNumber} ${p.name}, ${place || ''}, CA` : null, approx: isZip || (isStreet && !prefixNumber) };
  }
  async function photon(q, limit, signal) {
    const u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}&lang=en&bbox=${CA_BBOX}`;
    const r = await fetch(u, { headers: { Accept: 'application/json' }, signal }).then(r => r.json());
    return (r.features || []).filter(f => (f.properties.state || 'California') === 'California');
  }
  async function geocode(q, limit, signal) {
    const m = q.match(/^(\d+[a-z]?)\s+(.+)$/i);
    let items = (await photon(q, 12, signal)).map(f => suggestionFrom(f, null)).filter(Boolean);
    if (m && !items.some(it => it.rank === 0)) {
      // the exact house isn't in OpenStreetMap: offer the street, and let the Census geocoder pin the number
      const streets = (await photon(m[2], 12, signal)).map(f => suggestionFrom(f, m[1])).filter(it => it && it.rank === 1);
      items = streets.concat(items.filter(it => it.rank !== 1));
    }
    const seen = new Set();
    const order = m ? { 0: 0, 1: 1, 2: 2 } : { 2: 0, 1: 1, 0: 2 }; // with a house number, addresses first; otherwise places first
    return items.sort((a, b) => order[a.rank] - order[b.rank]).filter(it => { const k = it.label.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, limit);
  }
  // U.S. Census Bureau geocoder (JSONP; no key). Returns {lng, lat, label} or null.
  function census(q) {
    return new Promise(resolve => {
      const cb = 'censusCb' + Date.now(); const s = document.createElement('script'); const done = v => { delete window[cb]; s.remove(); resolve(v); };
      window[cb] = r => { const hit = r && r.result && r.result.addressMatches && r.result.addressMatches[0]; done(hit ? { lng: hit.coordinates.x, lat: hit.coordinates.y, label: hit.matchedAddress.replace(/, CA, \d+$/, '').replace(/\b([A-Z])([A-Z]+)\b/g, (w, a, b) => a + b.toLowerCase()) } : null); };
      s.onerror = () => done(null); setTimeout(() => done(null), 8000);
      s.src = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(q)}&benchmark=Public_AR_Current&format=jsonp&callback=${cb}`;
      document.head.appendChild(s);
    });
  }
  async function resolveAndLocate(it, typed) {
    setWhere('Finding your districts…');
    let { lng, lat, label } = it;
    if (it.needsCensus || (it.rank === 2 && /^\d+\s/.test(typed))) {
      const hit = await census(it.query || `${typed}, CA`);
      if (hit) ({ lng, lat, label } = hit); else if (it.approx) label += ' (approximate)';
    } else if (it.approx) label += ' (approximate)';
    await locate(lng, lat, label, it.county);
  }
  function renderAc() {
    if (!acItems.length) { acEl.hidden = true; acEl.innerHTML = ''; addrEl.setAttribute('aria-expanded', 'false'); return; }
    acEl.innerHTML = acItems.map((it, i) => `<li role="option" id="ac-${i}" ${i === acIndex ? 'aria-selected="true" class="on"' : ''}>${esc(it.label)}${it.postcode && it.rank !== 2 ? `<small> ${esc(it.postcode)}</small>` : ''}</li>`).join('');
    acEl.hidden = false; addrEl.setAttribute('aria-expanded', 'true');
    acEl.querySelectorAll('li').forEach((li, i) => { li.onmousedown = e => { e.preventDefault(); choose(i); }; });
  }
  function closeAc() { acItems = []; acIndex = -1; renderAc(); }
  async function choose(i) {
    const it = acItems[i]; if (!it) return;
    const typed = addrEl.value.trim(); addrEl.value = it.label; closeAc();
    await resolveAndLocate(it, typed);
  }
  addrEl.addEventListener('input', () => {
    const q = addrEl.value.trim(); clearTimeout(acTimer);
    if (q.length < 3) { closeAc(); return; }
    acTimer = setTimeout(async () => {
      const seq = ++acSeq; if (acCtl) acCtl.abort(); acCtl = new AbortController();
      loadGeo();
      try { const items = await geocode(q, 6, acCtl.signal); if (seq !== acSeq) return; acItems = items; acIndex = -1; renderAc(); }
      catch (err) { if (err.name !== 'AbortError') closeAc(); }
    }, 250);
  });
  addrEl.addEventListener('keydown', e => {
    if (acEl.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); acIndex = (acIndex + 1) % acItems.length; renderAc(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); acIndex = (acIndex - 1 + acItems.length) % acItems.length; renderAc(); }
    else if (e.key === 'Enter' && acIndex >= 0) { e.preventDefault(); choose(acIndex); }
    else if (e.key === 'Escape') closeAc();
  });
  addrEl.addEventListener('blur', () => setTimeout(closeAc, 150));

  let lookupSeq = 0;
  document.getElementById('addr-form').onsubmit = async e => {
    e.preventDefault();
    if (!acEl.hidden && acItems.length) { choose(acIndex >= 0 ? acIndex : 0); return; }
    const q = addrEl.value.trim(); if (!q) return;
    const seq = ++lookupSeq; setWhere('Looking up address…'); findBtn.disabled = true;
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 10000);
    loadGeo();
    try {
      const items = await geocode(q, 1, ctl.signal);
      if (seq !== lookupSeq) return;
      if (!items.length) { setWhere('No match in California. Try a street address with city, or a ZIP code, or pick your districts below.'); return; }
      await resolveAndLocate(items[0], q);
    } catch (err) { if (seq === lookupSeq) setWhere(err.name === 'AbortError' ? 'Address lookup timed out. Try again or pick your districts below.' : 'Address lookup failed. Pick your districts below instead.'); }
    finally { clearTimeout(timer); if (seq === lookupSeq) findBtn.disabled = false; }
  };

  // manual pickers
  const senateUp = new Set((B.senate_index && B.senate_index.on_ballot) || Object.keys(B.senate).map(Number));
  function fillSelect(id, n, labelFn) { const s = document.getElementById(id); for (let i = 1; i <= n; i++) { const o = document.createElement('option'); o.value = i; o.textContent = labelFn ? labelFn(i) : i; s.appendChild(o); } }
  fillSelect('sel-cd', 52); fillSelect('sel-sd', 40, i => senateUp.has(i) ? `${i}` : `${i} (not up)`); fillSelect('sel-ad', 80);
  const counties = (B.resources && B.resources.counties || []).map(c => c.name);
  counties.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; document.getElementById('sel-county').appendChild(o); });
  for (const [id, key] of [['sel-cd', 'cd'], ['sel-sd', 'sd'], ['sel-ad', 'ad']]) document.getElementById(id).onchange = e => { state[key] = e.target.value ? +e.target.value : null; state.label = null; save(); render(); };
  document.getElementById('sel-county').onchange = e => { state.county = e.target.value || null; state.boe = boeForCounty(state.county); state.label = null; save(); render(); };

  // ---------- render ----------
  const toc = document.getElementById('toc'), out = document.getElementById('contests');
  function render() {
    for (const [id, key] of [['sel-cd', 'cd'], ['sel-sd', 'sd'], ['sel-ad', 'ad'], ['sel-county', 'county']]) document.getElementById(id).value = state[key] || '';
    const parts = [];
    if (state.cd) parts.push(`House district ${state.cd}`); if (state.sd) parts.push(`Senate district ${state.sd}`); if (state.ad) parts.push(`Assembly district ${state.ad}`); if (state.county) parts.push(`${state.county} County`);
    setWhere(parts.length ? (state.label ? `${state.label}: ` : '') + parts.join(' · ') : 'Enter an address to see your full ballot. Statewide contests are shown for everyone.');

    const secs = [];
    // statewide offices
    const sw = B.statewide;
    let swHTML = '';
    if (sw) {
      const boe = state.boe || boeForCounty(state.county);
      const offices = sw.offices.filter(o => !o.district || !boe || o.district === boe);
      swHTML = offices.map(o => contestHTML(o.office + (o.district ? ` · District ${o.district}` : ''), o, { id: 'office-' + o.id, sub: o.nonpartisan ? 'nonpartisan' : o.district && !boe ? 'you vote in one of the four districts, depending on your county' : '' })).join('');
      if (sw.us_senate && sw.us_senate.note) swHTML += `<p class="empty">${esc(sw.us_senate.note)}</p>`;
    } else swHTML = '<p class="empty">Statewide contests are still being compiled.</p>';
    secs.push(['statewide', 'Statewide offices', swHTML]);
    // props
    secs.push(['props', 'Propositions', B.props ? B.props.props.map(propHTML).join('') : '<p class="empty">Propositions are still being compiled.</p>']);
    // house
    const house = state.cd ? R.districts[state.cd] : null;
    secs.push(['house', 'U.S. House', state.cd ? contestHTML(`Congressional District ${state.cd}`, house, { extra: `<p class="links"><a href="index.html#d${state.cd}">See this district on the map</a></p>` }) : '<p class="empty">Enter an address or pick a House district above.</p>']);
    // senate
    let sen;
    if (!state.sd) sen = '<p class="empty">Enter an address or pick a Senate district above.</p>';
    else if (!senateUp.has(state.sd)) sen = `<p class="empty">Senate District ${state.sd} is not up for election in 2026 (odd-numbered seats next vote in 2028).</p>`;
    else sen = contestHTML(`State Senate District ${state.sd}`, B.senate[state.sd]);
    secs.push(['senate', 'State Senate', sen]);
    // assembly
    secs.push(['assembly', 'State Assembly', state.ad ? contestHTML(`Assembly District ${state.ad}`, B.assembly[state.ad]) : '<p class="empty">Enter an address or pick an Assembly district above.</p>']);
    // local
    const res = B.resources, cty = res && state.county ? res.counties.find(c => c.name.toLowerCase() === state.county.toLowerCase()) : null;
    let loc = '<p class="summary">County, city, school and special-district contests vary block by block and are not compiled here. Your county elections office publishes the exact sample ballot for your address.</p>';
    if (cty) loc += `<p class="links">${link(cty.url, esc(cty.office || cty.name + ' County elections'))}${link(cty.sample_ballot_url, 'Sample ballot lookup')}${cty.phone ? `<span>${esc(cty.phone)}</span>` : ''}</p>`;
    if (res) {
      const now = new Date(), today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const dates = (res.key_dates || []).filter(d => d.date >= today);
      loc += (dates.length ? `<ul class="dates">${dates.map(d => `<li><b>${esc(d.date)}</b> ${esc(d.label)}</li>`).join('')}</ul>` : '') +
        `<p class="links">${res.statewide_links.map(l => link(l.url, esc(l.label))).join('')}</p>` +
        (res.voter_hotline ? `<p class="summary small">Secretary of State voter hotline: ${esc(res.voter_hotline)}</p>` : '');
    }
    secs.push(['local', 'Local and voting info', loc]);

    out.innerHTML = secs.map(([id, t, h]) => `<section class="sec" id="${id}"><h2>${t}</h2>${h}</section>`).join('');
    toc.innerHTML = secs.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('');
    toc.querySelectorAll('a').forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById(a.getAttribute('href').slice(1)).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
  render();
})();
