/* California ballot browser · November 2026 */
(async function () {
  const [B, R] = await Promise.all([
    fetch('data/ballot.json', { cache: 'no-cache' }).then(r => r.json()),
    fetch('data/races.json', { cache: 'no-cache' }).then(r => r.json()),
  ]);
  document.getElementById('updated').textContent = 'updated ' + B.updated;

  // ---------- shared helpers ----------
  const css = getComputedStyle(document.documentElement);
  const PARTY_COLOR = { D: css.getPropertyValue('--solid-d').trim(), R: css.getPropertyValue('--solid-r').trim(), I: '#6b6b6b', NPP: '#6b6b6b', G: '#3b7d3b', L: '#b08d00', PF: '#6b6b6b', AIP: '#6b6b6b' };
  const PARTY_NAME = { D: 'Democrat', R: 'Republican', I: 'Independent', NPP: 'No party preference', G: 'Green', L: 'Libertarian', PF: 'Peace and Freedom', AIP: 'American Independent' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SUFFIX = new Set(['ii', 'iii', 'iv', 'jr', 'jr.', 'sr', 'sr.']), PARTICLE = new Set(['von', 'van', 'de', 'da', 'del', 'della', 'di', 'la', 'le', 'du']);
  function last(n) {
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
      <div class="cand-head">${c.party ? pd(c.party) : ''}<span class="name">${esc(c.name)}</span>${c.party ? `<span class="tag" title="${PARTY_NAME[c.party] || ''}">${esc(c.party)}</span>` : ''}${c.incumbent ? '<span class="tag">Incumbent</span>' : ''}${isLW ? '<span class="tag lw">Likely winner</span>' : ''}${c.primary_pct != null ? `<span class="pct">${pct(c.primary_pct)}% in June primary</span>` : ''}</div>
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
    return `<article class="contest" id="${opts.id || ''}">
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
  if ([...hp.keys()].some(k => ['cd', 'sd', 'ad', 'boe', 'county'].includes(k))) { state.label = null; for (const k of ['cd', 'sd', 'ad', 'boe']) state[k] = hp.get(k) ? +hp.get(k) : null; state.county = hp.get('county') || null; }
  function save() { try { const { label, ...keep } = state; localStorage.setItem('ballot-loc', JSON.stringify(keep)); } catch (e) { /* ignore */ } const q = new URLSearchParams(); for (const k of ['cd', 'sd', 'ad', 'boe', 'county']) if (state[k]) q.set(k, state[k]); history.replaceState(null, '', q.toString() ? '#' + q : ' '); }

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

  async function locate(lng, lat, label, county) {
    const g = await loadGeo();
    state.cd = districtAt(g.cd, lng, lat); state.sd = districtAt(g.sd, lng, lat); state.ad = districtAt(g.ad, lng, lat); state.boe = districtAt(g.boe, lng, lat);
    if (!state.cd) { setWhere('That point is outside California.'); return; }
    state.county = county || state.county; state.label = label || null;
    save(); render();
  }
  const whereEl = document.getElementById('where');
  function setWhere(t) { whereEl.textContent = t; }

  // address search (Nominatim)
  document.getElementById('addr-form').onsubmit = async e => {
    e.preventDefault();
    const q = document.getElementById('addr').value.trim(); if (!q) return;
    setWhere('Looking up address…');
    try {
      const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&addressdetails=1&q=${encodeURIComponent(q + (/california|,\s*ca\b/i.test(q) ? '' : ', California'))}`;
      const res = await fetch(u, { headers: { Accept: 'application/json' } }).then(r => r.json());
      if (!res.length) { setWhere('Address not found. Try adding the city or ZIP code.'); return; }
      const a = res[0].address || {};
      if (a.state && a.state !== 'California') { setWhere('That address is outside California.'); return; }
      await locate(+res[0].lon, +res[0].lat, res[0].display_name.split(',').slice(0, 3).join(','), (a.county || '').replace(/ County$/, ''));
    } catch (err) { setWhere('Address lookup failed. Pick your districts below instead.'); }
  };
  // manual pickers
  const senateUp = new Set((B.senate_index && B.senate_index.on_ballot) || Object.keys(B.senate).map(Number));
  function fillSelect(id, n, labelFn) { const s = document.getElementById(id); for (let i = 1; i <= n; i++) { const o = document.createElement('option'); o.value = i; o.textContent = labelFn ? labelFn(i) : i; s.appendChild(o); } }
  fillSelect('sel-cd', 52); fillSelect('sel-sd', 40, i => senateUp.has(i) ? `${i}` : `${i} (not up)`); fillSelect('sel-ad', 80);
  const counties = (B.resources && B.resources.counties || []).map(c => c.name);
  counties.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; document.getElementById('sel-county').appendChild(o); });
  for (const [id, key] of [['sel-cd', 'cd'], ['sel-sd', 'sd'], ['sel-ad', 'ad']]) document.getElementById(id).onchange = e => { state[key] = e.target.value ? +e.target.value : null; state.label = null; if (key === 'cd') state.boe = null; save(); render(); };
  document.getElementById('sel-county').onchange = e => { state.county = e.target.value || null; state.label = null; save(); render(); };

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
      const offices = sw.offices.filter(o => !o.district || !state.boe || o.district === state.boe);
      swHTML = offices.map(o => contestHTML(o.office + (o.district ? ` · District ${o.district}` : ''), o, { id: 'office-' + o.id, sub: o.nonpartisan ? 'nonpartisan' : '' })).join('');
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
      const today = new Date().toISOString().slice(0, 10);
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
