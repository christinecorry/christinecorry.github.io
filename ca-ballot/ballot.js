/* California ballot browser · November 2026 */
(async function () {
  const esc0 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const getJSON = u => fetch(u, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  let B, R;
  try { [B, R] = await Promise.all([getJSON('data/ballot.json'), getJSON('data/races.json')]); }
  catch (err) { document.getElementById('contests').innerHTML = '<p class="empty">Couldn\'t load the election data. Please reload the page.</p>'; return; }
  const Res = await getJSON('data/results.json').catch(() => null);
  if (Res) for (const k of ['statewide', 'props', 'house', 'senate', 'assembly']) Res[k] ||= {};
  document.getElementById('updated').textContent = Res ? 'results as of ' + Res.as_of_label : 'updated ' + B.updated;
  if (Res) document.getElementById('res-banner').innerHTML = `<b>Partial results as of ${esc0(Res.as_of_label)}.</b> About ${Res.pct_counted}% of the expected vote is counted, with ${esc0(Res.est_remaining)} votes estimated to remain in the governor's race (NBC News estimates). Dates show when each race's count was reported, in Pacific time. A race shows as won, passed or failed once a news organization has called it. "Leading" only describes the count so far, and the order can change. The Secretary of State certifies results on December 11.`;

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

  const fmt = n => n.toLocaleString('en-US');
  function resultTag(c, res) {
    if (res.winner === c.name) return res.status === 'unopposed' ? '<span class="tag lw">Unopposed</span>' : '<span class="tag lw">Won</span>';
    return res.status === 'leading' && res.leader === c.name ? '<span class="tag lead">Leading</span>' : '';
  }
  function candHTML(c, lw, res) {
    const isLW = res ? res.winner === c.name : lw && c.name === lw;
    const v = res && (res.candidates || []).find(x => x.name === c.name);
    return `<div class="cand ${isLW ? 'likely' : ''}">
      <div class="cand-head">${c.party ? pd(c.party) : ''}<span class="name">${esc(c.name)}</span>${c.party ? `<span class="tag" title="${PARTY_NAME[c.party] || ''}">${esc(c.party)}</span>` : ''}${c.incumbent ? '<span class="tag">Incumbent</span>' : ''}${res ? resultTag(c, res) : isLW ? '<span class="tag lw">Favored</span>' : ''}${v ? `<span class="pct res">${v.pct}% · ${fmt(v.votes)}</span>` : c.primary_pct != null ? `<span class="pct">${pct(c.primary_pct)}% in June primary</span>` : ''}</div>
      ${v ? `<div class="res-bar"><span style="width:${v.pct}%;background:${PARTY_COLOR[c.party] || '#6b6b6b'}"></span></div>` : ''}
      ${v && c.primary_pct != null ? `<p class="lean-note">${pct(c.primary_pct)}% in June primary</p>` : ''}
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
  const SOS = 'https://electionresults.sos.ca.gov/returns/';
  const OFFICE_PATH = { governor: 'governor', lt_governor: 'lieutenant-governor', attorney_general: 'attorney-general', secretary_of_state: 'secretary-of-state', treasurer: 'treasurer', controller: 'controller', insurance_commissioner: 'insurance-commissioner', superintendent: 'superintendent-of-public-instruction' };
  function resultLine(res, sosPath) {
    const sos = sosPath ? link(SOS + sosPath, 'Secretary of State') : '';
    if (res.status === 'no_data') return `<p class="res-line"><span class="res-status">Counting</span> Vote totals for this race aren't compiled here yet.${sos ? ` See the ${sos}.` : ''}</p>`;
    if (res.status === 'unopposed') return `<p class="res-line"><span class="res-status done">Unopposed</span> Only one candidate is on the ballot.</p>`;
    const bits = [];
    if (res.pct_in != null) bits.push(`${res.pct_in}% of expected vote counted`);
    if (res.status === 'projected') bits.push(`called by ${esc(res.called_by)}`);
    if (res.status === 'projected' && !res.total) bits.push('vote totals not compiled here');
    if (res.status === 'leading') bits.push('not yet called');
    if (res.total) bits.push(countSrc(res));
    return `<p class="res-line"><span class="res-status ${res.status === 'projected' ? 'done' : ''}">${res.status === 'projected' ? 'Called' : 'Counting'}</span> ${bits.join(' · ')}${sos ? ` · ${sos}` : ''}</p>${res.note ? `<p class="res-line">${esc(res.note)}</p>` : ''}`;
  }
  const countSrc = x => x.as_of ? `count from ${esc(x.source)}, ${esc(x.as_of)}` : `earlier count from ${esc(x.source)}, date not stated`;
  function preHTML(inner) { return inner.trim() ? `<details class="pre"><summary>Before the election: outlook, ratings and polls</summary>${inner}</details>` : ''; }
  function contestHTML(title, r, opts = {}) {
    if (!r) return `<article class="contest"><h3>${title}</h3><p class="empty">${opts.missing || 'Details for this contest are still being compiled.'}</p></article>`;
    const res = opts.res, order = res ? (res.candidates || []).map(x => x.name) : [];
    const rank = c => { const i = order.indexOf(c.name); return i < 0 ? 99 : i; };
    const cands = [...(r.candidates || [])].sort((a, b) => rank(a) - rank(b));
    const pre = `${r.likely_winner_basis ? `<p class="basis">${esc(r.likely_winner_basis)}</p>` : ''}${ratingsHTML(r.ratings)}${pollsHTML(r.polls, cands)}`;
    return `<article class="contest"${opts.id ? ` id="${opts.id}"` : ''}>
      <h3>${title}${opts.sub ? ` <span class="sub">${opts.sub}</span>` : ''}</h3>
      ${res ? resultLine(res, opts.sos) : ''}
      ${r.summary && !res ? `<p class="summary">${esc(r.summary)}</p>` : ''}
      ${r.incumbent ? `<p class="summary small">Incumbent: ${r.incumbent.party ? pd(r.incumbent.party) : ''}${esc(r.incumbent.name)}${r.incumbent.note ? ` · ${esc(r.incumbent.note)}` : ''}</p>` : ''}
      ${r.partisan_lean ? `<p class="lean-note">${esc(r.partisan_lean)}</p>` : ''}
      ${cands.length ? cands.map(c => candHTML(c, r.likely_winner, res)).join('') : '<p class="empty">No candidates listed.</p>'}
      ${res ? preHTML((r.summary ? `<p class="summary">${esc(r.summary)}</p>` : '') + pre) : pre}
      ${opts.extra || ''}
    </article>`;
  }
  function propStatus(x) {
    if (x.status === 'projected') return x.outcome === 'passed' ? 'Passed' : 'Failed';
    return `${x.yes_pct > x.no_pct ? 'Yes' : 'No'} leading, not called`;
  }
  function propResult(x) {
    if (!x) return '';
    return `<div class="prop-res"><p class="res-line"><span class="res-status ${x.status === 'projected' ? 'done' : ''}">${propStatus(x)}</span> ${x.pct_in}% of expected vote counted${x.called_by ? ` · called by ${esc(x.called_by)}` : ''} · ${countSrc(x)}</p>
      <div class="yn-bar"><span class="y" style="width:${x.yes_pct}%"></span><span class="n" style="width:${x.no_pct}%"></span></div>
      <div class="yn-num"><span>Yes ${x.yes_pct}% · ${fmt(x.yes)}</span><span>No ${x.no_pct}% · ${fmt(x.no)}</span></div></div>`;
  }
  function propSummary() {
    if (!Res) return '';
    return `<table class="polls prop-sum"><thead><tr><th>Prop</th><th>Measure</th><th style="text-align:right">Yes</th><th style="text-align:right">Status</th></tr></thead><tbody>${B.props.props.map(p => { const x = Res.props[p.number]; return x ? `<tr><td><a href="#prop-${p.number}">${p.number}</a></td><td>${esc(p.title)}</td><td class="n">${x.yes_pct}%</td><td class="n">${propStatus(x)}</td></tr>` : ''; }).join('')}</tbody></table>`;
  }
  function propHTML(p) {
    const x = Res && Res.props[p.number];
    return `<article class="contest prop" id="prop-${p.number}">
      <h3>Proposition ${p.number} <span class="sub">${esc(p.title)}</span></h3>
      ${propResult(x)}
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
      ${x ? ((p.polls || []).length ? `<details class="pre"><summary>Pre-election polls</summary>${pollsHTML(p.polls, [])}</details>` : '') : pollsHTML(p.polls, [])}
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
  let lookupSeq = 0;
  const findBtn = document.querySelector('#addr-form button[type=submit]');
  document.getElementById('addr-form').onsubmit = async e => {
    e.preventDefault();
    const q = document.getElementById('addr').value.trim(); if (!q) return;
    const seq = ++lookupSeq; setWhere('Looking up address…'); findBtn.disabled = true;
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 10000);
    loadGeo();
    try {
      const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&addressdetails=1&viewbox=-124.6,42.1,-114.0,32.3&bounded=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(u, { headers: { Accept: 'application/json' }, signal: ctl.signal }).then(r => r.json());
      if (seq !== lookupSeq) return;
      if (!res.length) { setWhere('No match in California. Try a street address with city, or a ZIP code, or pick your districts below.'); return; }
      const hit = res[0], a = hit.address || {};
      if (a.state && a.state !== 'California') { setWhere('That address is outside California.'); return; }
      let county = (a.county || '').replace(/ County$/, '');
      if (!county && a.city && COUNTY_NAMES.some(n => n.toLowerCase() === a.city.toLowerCase())) county = a.city;
      const label = [[a.house_number, a.road].filter(Boolean).join(' '), a.city || a.town || a.village || a.hamlet || a.county].filter(Boolean).join(', ') || hit.display_name.split(',').slice(0, 2).join(',');
      await locate(+hit.lon, +hit.lat, label + (hit.type === 'postcode' ? ' (ZIP code center, approximate)' : ''), county);
    } catch (err) { if (seq === lookupSeq) setWhere(err.name === 'AbortError' ? 'Address lookup timed out. Try again or pick your districts below.' : 'Address lookup failed. Pick your districts below instead.'); }
    finally { clearTimeout(timer); if (seq === lookupSeq) findBtn.disabled = false; }
  };
  // manual pickers
  const senateUp = new Set((B.senate_index && B.senate_index.on_ballot) || Object.keys(B.senate).map(Number));
  function fillSelect(id, n, labelFn) { const s = document.getElementById(id); for (let i = 1; i <= n; i++) { const o = document.createElement('option'); o.value = i; o.textContent = labelFn ? labelFn(i) : i; s.appendChild(o); } }
  fillSelect('sel-cd', 52); fillSelect('sel-sd', 40, i => senateUp.has(i) ? `${i}` : `${i} (no election this year)`); fillSelect('sel-ad', 80);
  const counties = (B.resources && B.resources.counties || []).map(c => c.name);
  counties.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; document.getElementById('sel-county').appendChild(o); });
  for (const [id, key] of [['sel-cd', 'cd'], ['sel-sd', 'sd'], ['sel-ad', 'ad']]) document.getElementById(id).onchange = e => { state[key] = e.target.value ? +e.target.value : null; state.label = null; save(); render(); };
  document.getElementById('sel-county').onchange = e => { state.county = e.target.value || null; state.boe = boeForCounty(state.county); state.label = null; save(); render(); };

  // ---------- render ----------
  const toc = document.getElementById('toc'), out = document.getElementById('contests');
  function render() {
    for (const [id, key] of [['sel-cd', 'cd'], ['sel-sd', 'sd'], ['sel-ad', 'ad'], ['sel-county', 'county']]) document.getElementById(id).value = state[key] || '';
    const parts = [];
    if (state.cd) parts.push(`House district ${state.cd}`); if (state.sd) parts.push(`State Senate district ${state.sd}${senateUp.has(state.sd) ? '' : ' (no election this year)'}`); if (state.ad) parts.push(`Assembly district ${state.ad}`); if (state.county) parts.push(`${state.county} County`);
    setWhere(parts.length ? (state.label ? `${state.label}: ` : '') + parts.join(' · ') : 'Enter an address to see the results for your full ballot. Statewide contests are shown for everyone.');

    const secs = [];
    // statewide offices
    const sw = B.statewide;
    let swHTML = '';
    if (sw) {
      const boe = state.boe || boeForCounty(state.county);
      const offices = sw.offices.filter(o => !o.district || !boe || o.district === boe);
      swHTML = offices.map(o => contestHTML(o.office + (o.district ? ` · District ${o.district}` : ''), o, { id: 'office-' + o.id, res: Res && Res.statewide[o.id], sos: o.district ? `board-of-equalization/district/${o.district}` : OFFICE_PATH[o.id], sub: o.nonpartisan ? 'nonpartisan' : o.district && !boe ? 'you vote in one of the four districts, depending on your county' : '' })).join('');
      if (sw.us_senate && sw.us_senate.note) swHTML += `<p class="empty">${esc(sw.us_senate.note)}</p>`;
    } else swHTML = '<p class="empty">Statewide contests are still being compiled.</p>';
    secs.push(['statewide', 'Statewide offices', swHTML]);
    // props
    secs.push(['props', 'Propositions', B.props ? propSummary() + B.props.props.map(propHTML).join('') : '<p class="empty">Propositions are still being compiled.</p>']);
    // house
    const house = state.cd ? R.districts[state.cd] : null;
    secs.push(['house', 'U.S. House', state.cd ? contestHTML(`Congressional District ${state.cd}`, house, { res: Res && Res.house[state.cd], sos: `us-rep/district/${state.cd}`, extra: `<p class="links"><a href="index.html#d${state.cd}">See this district on the map</a></p>` }) : '<p class="empty">Enter an address or pick a House district above.</p>']);
    // senate
    let sen;
    if (!state.sd) sen = '<p class="empty">Enter an address or pick a State Senate district above.</p>';
    else if (!senateUp.has(state.sd)) sen = `<p class="empty">You live in Senate District ${state.sd}, but it has no election this year. State senators serve four-year terms; even-numbered districts vote in 2026 and odd-numbered districts in 2028.</p>`;
    else sen = contestHTML(`State Senate District ${state.sd}`, B.senate[state.sd], { res: Res && Res.senate[state.sd], sos: `state-senate/district/${state.sd}` });
    secs.push(['senate', 'State Senate', sen]);
    // assembly
    secs.push(['assembly', 'State Assembly', state.ad ? contestHTML(`Assembly District ${state.ad}`, B.assembly[state.ad], { res: Res && Res.assembly[state.ad], sos: `state-assembly/district/${state.ad}` }) : '<p class="empty">Enter an address or pick an Assembly district above.</p>']);
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
    [...toc.querySelectorAll('a'), ...out.querySelectorAll('.prop-sum a')].forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById(a.getAttribute('href').slice(1)).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
  render();
})();
