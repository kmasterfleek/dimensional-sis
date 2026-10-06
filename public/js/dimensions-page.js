// The Dimensions page: every way this system can see a student, how much of
// each is known across the district, and the place to invent a new one by
// writing a sentence.
import { api, h, clear, render, state, status, go, displayName } from '/app.js';
import { t } from '/js/edition.js';
import { FAMILY_COLOR } from '/js/dimensions.js';

const color = (f) => `var(${FAMILY_COLOR[f] || '--accent'})`;
const isAdmin = () => state.user?.role === 'admin';

export async function show() {
  const [cat, cov] = await Promise.all([api('/api/dimensions'), api('/api/dimensions/coverage')]);
  const pct = Object.fromEntries(cov.coverage.map((c) => [c.key, c]));
  const custom = cat.dimensions.filter((d) => d.custom);
  render(h('div',
    h('h1', t('Dimensions')),
    h('p.lede', t(`${cat.total} ways of seeing a student, in ${cat.families.length} families, across ${cov.students} students. Every one is optional; the gaps are a to-do list, not a hole. Anyone on staff can add a new one by writing a sentence.`)),
    conceptCard(custom),
    h('div.grid.two', { style: 'margin-top:14px' }, cat.families.map((f) => familyCard(f, cat.dimensions.filter((d) => d.family === f.id), pct))),
    isAdmin() ? adminCard() : null,
  ));
}

function familyCard(f, dims, pct) {
  const known = dims.reduce((a, d) => a + (pct[d.key]?.pct || 0), 0) / Math.max(1, dims.length);
  return h('div.card',
    h('div.spread', h('h3', { style: 'margin:0' }, h('span.dot', { style: `background:${color(f.id)}` }), ' ', t(f.label)), h('span.small.muted', `${dims.length} · ${Math.round(known * 100)}% known`)),
    h('p.small.muted', t(f.desc)),
    h('details', h('summary.small', t('Show each dimension')),
      h('div.bars', { style: 'margin-top:8px' }, dims.map((d) => h('div.barrow', { title: d.desc || '' },
        h('span', d.label),
        h('div.bartrack', h('div.barfill', { style: `width:${Math.round((pct[d.key]?.pct || 0) * 100)}%;background:${color(f.id)}` })),
        h('span.small.muted', `${Math.round((pct[d.key]?.pct || 0) * 100)}%`))))));
}

/** Invent a dimension: a label and one sentence. Preview first, then save. */
function conceptCard(custom) {
  const label = h('input', { id: 'cd-label', type: 'text', maxlength: 60, placeholder: 'Bullying and being targeted' });
  const sentence = h('textarea', { id: 'cd-sentence', rows: 2, placeholder: 'Being bullied, harassed online, or made to feel like you do not belong.' });
  const out = h('div');
  const err = h('p.err', { role: 'alert' });
  const card = h('div.card', { style: 'margin-top:14px' },
    h('h3', { style: 'margin-top:0' }, t('Add a dimension by writing a sentence')),
    h('p.small.muted', t('Describe what you want to notice the way you would say it to a colleague. Every student’s own shared words (speeches, reflections, work) are read against it by meaning, on this machine. Private journals never count.')),
    h('div.inline-form',
      h('div', h('label', { for: 'cd-label' }, t('Name')), label),
      h('div', { style: 'flex:3 1 320px' }, h('label', { for: 'cd-sentence' }, t('The sentence')), sentence)),
    err,
    h('div.row', { style: 'gap:8px;margin-top:8px' },
      h('button.btn.ghost', { onclick: () => run(true) }, t('Preview who it finds')),
      h('button.btn', { onclick: () => run(false) }, t('Add it for every student'))),
    out,
    custom.length ? h('div', { style: 'margin-top:14px' }, h('h4', t('Added here')), custom.map((d) => h('div.unlock',
      h('div', h('strong', d.label), h('p.small.muted', { style: 'margin:2px 0 0' }, `“${d.sentence}”`)),
      isAdmin() ? h('button.linkish', { onclick: () => retire(d) }, t('Retire')) : null))) : null);

  async function run(preview) {
    err.textContent = '';
    if (!preview && !label.value.trim()) { err.textContent = t('Give it a name.'); return; }
    out.replaceChildren(h('p.small.muted', t('Reading every student’s words…')));
    try {
      const r = await api('/api/dimensions/concepts', { method: 'POST', body: { label: label.value, sentence: sentence.value, preview } });
      if (!preview) { status(t(`Added “${r.dimension.label}” and scored ${r.scored} students.`)); show(); return; }
      out.replaceChildren(
        h('p.small', t(`${r.reached} of ${r.students} students’ own words clearly reach this. Strongest matches:`)),
        h('div.stack', r.top.map((x) => h('div.unlock', { style: 'cursor:pointer', onclick: () => go('/person/' + x.entityId) },
          h('div', h('strong', x.person ? (state.scope?.pii ? displayName(x.person) : x.person.id) : x.entityId), h('p.small.muted', { style: 'margin:2px 0 0;font-style:italic' }, `“${x.snippet.slice(0, 220)}”`)),
          h('span.small', `${Math.round(x.score * 100)}`)))));
    } catch (e) { out.replaceChildren(); err.textContent = e.message; }
  }
  async function retire(d) {
    if (!window.confirm(`Retire “${d.label}”? Its scores are removed; the ledger keeps the history.`)) return;
    await api('/api/dimensions/concepts/' + encodeURIComponent(d.key), { method: 'DELETE' });
    show();
  }
  return card;
}

/** Recompute derived dimensions, and bring in public neighborhood data. */
function adminCard() {
  const slot = h('div');
  const csv = h('textarea', { id: 'pl-csv', rows: 4, placeholder: 'id,name,lat,lon,walkability,treeCanopy,heatDays,pm25,...' });
  const card = h('div.card', { style: 'margin-top:14px' },
    h('h3', { style: 'margin-top:0' }, t('Keep it current')),
    h('div.row', { style: 'gap:8px' },
      h('button.btn.ghost', { onclick: recompute }, t('Recompute derived dimensions')),
      h('span.small.muted', t('Attendance detail, voice, neighborhood and commute estimates, from the data already here.'))),
    h('details', { style: 'margin-top:12px' }, h('summary', t('Neighborhood data')), placesBody()),
    slot);
  async function recompute() {
    slot.replaceChildren(h('p.small.muted', t('Recomputing…')));
    try { const r = await api('/api/dimensions/derive', { method: 'POST' }); slot.replaceChildren(h('p.notice', t(`Updated ${Object.values(r.written).reduce((a, b) => a + b, 0)} values (only what changed is written to the ledger).`))); }
    catch (e) { slot.replaceChildren(h('p.err', e.message)); }
  }
  function placesBody() {
    const body = h('div', h('p.small.muted', t('Loading…')));
    api('/api/dimensions/places').then(({ blocks }) => clear(body).append(
      h('p.small.muted', t(`${blocks.length} block groups on file${blocks[0]?.source ? ` (${blocks[0].source})` : ''}. Public data is downloaded once and joined to each student’s home block group here; no student address is ever sent anywhere.`)),
      h('p.small', t('Paste a CSV with one row per census block group (id = GEOID). Columns that match a Place dimension are used; the rest are ignored.')),
      csv,
      h('button.btn', { style: 'margin-top:8px', onclick: upload }, t('Import neighborhood data')))).catch((e) => body.replaceChildren(h('p.err', e.message)));
    return body;
  }
  async function upload() {
    try { const r = await api('/api/dimensions/places', { method: 'POST', body: { csv: csv.value } }); status(t(`${r.blocks} block groups imported; ${r.joined} student values updated.`)); show(); }
    catch (e) { status(e.message, true); }
  }
  return card;
}
