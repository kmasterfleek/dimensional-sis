// A student in every dimension the school can see: a fingerprint of all of
// them at once, how complete it is per family, what would fill the gaps, and
// each value with where it came from. Unknown is drawn as unknown, never zero.
import { api, h, clear, state, status, when } from '/app.js';
import { t } from '/js/edition.js';
import { dimensionForm, speechForm } from '/js/dimension-forms.js';

export const FAMILY_COLOR = { record: '--d-academic', self: '--d-wellness', journey: '--watch', voice: '--accent', observed: '--ok', place: '--ink-faint' };
const color = (f) => `var(${FAMILY_COLOR[f] || '--accent'})`;
const SOURCE = { import: 'from the record', derived: 'computed here', estimated: 'estimated', student: 'they told us', family: 'family told us', staff: 'staff', concept: 'read from their words', public: 'public data' };

/** The section on the person page. Returns a node that fills itself in. */
export function dimensionsSection(personId, { onQuestions } = {}) {
  const root = h('section', { style: 'margin-top:22px' }, h('p.small.muted', t('Loading dimensions…')));
  let tab = 'record';
  async function load() {
    let p;
    try { p = await api(`/api/people/${encodeURIComponent(personId)}/profile`); }
    catch (e) { if (e.status === 404) { root.replaceChildren(); return; } root.replaceChildren(h('p.err', e.message)); return; }
    onQuestions?.(p.questions);
    draw(p);
  }
  function draw(p) {
    const fams = p.completeness.families;
    if (!fams.some((f) => f.id === tab)) tab = fams[0]?.id;
    const body = h('div');
    const tabs = h('div.tabs', { role: 'tablist' }, fams.map((f) => h('button', {
      role: 'tab', 'aria-selected': String(tab === f.id),
      onclick: () => { tab = f.id; draw(p); },
    }, h('span.dot', { style: `background:${color(f.id)}` }), ` ${t(f.label)} `, h('span.small.muted', `${f.known}/${f.total}`))));
    const fam = fams.find((f) => f.id === tab);
    body.append(
      h('p.small.muted', { style: 'margin:10px 0' }, t(fam.desc)),
      table(p.dimensions.filter((d) => d.family === tab), personId, load),
    );
    clear(root).append(
      h('h2', t('Every dimension')),
      h('p.lede', t(`${p.completeness.known} of ${p.completeness.total} dimensions known, at ${Math.round(p.completeness.confidence / Math.max(0.01, p.completeness.pct) * 100)}% average confidence. Grey means unknown, not zero.`)),
      h('div.card', fingerprint(p.dimensions), familyBars(fams)),
      unlockCard(p.unlocks, personId, p.dimensions, load),
      h('div.card', { style: 'margin-top:14px' }, tabs, body),
    );
  }
  load();
  return root;
}

/** Every dimension as one cell: colored by family, shaded by value, grey when unknown. */
function fingerprint(dims) {
  const cells = dims.filter((d) => d.kind !== 'text' && d.kind !== 'category');
  return h('div',
    h('div.fp', { role: 'img', 'aria-label': `${cells.filter((d) => d.norm != null).length} of ${cells.length} measurable dimensions known` },
      cells.map((d) => h('span.fp-cell', {
        title: `${d.label}: ${d.norm == null ? 'unknown' : display(d)}${d.context ? ' (context)' : ''}`,
        style: d.norm == null ? '' : `background:${color(d.family)};opacity:${(0.18 + 0.82 * d.norm).toFixed(2)}`,
      }))),
    h('p.small.muted', { style: 'margin:8px 0 0' }, t('Each square is one dimension. Darker is further toward the favorable end; Place squares show the neighborhood, not the child.')));
}

function familyBars(fams) {
  return h('div.fp-fams', fams.map((f) => h('div.fp-fam',
    h('span.small', h('span.dot', { style: `background:${color(f.id)}` }), ' ', t(f.label)),
    h('div.bartrack', h('div.barfill', { style: `width:${Math.round(f.pct * 100)}%;background:${color(f.id)}` })),
    h('span.small.muted', `${f.known}/${f.total}`))));
}

/** The PitchIntel move: the gaps as a to-do list, biggest first. */
function unlockCard(unlocks, personId, dims, reload) {
  if (!unlocks.length) return h('p.notice', { style: 'margin-top:14px' }, t('Every dimension this account can see is filled in.'));
  const slot = h('div');
  return h('div.card', { style: 'margin-top:14px' },
    h('h3', { style: 'margin-top:0' }, t('What would fill in the rest')),
    h('div.stack', unlocks.slice(0, 6).map((u) => h('div.unlock',
      h('div', h('strong', `+${u.count} `), t(u.label), h('p.small.muted', { style: 'margin:2px 0 0' }, u.sample.join(', ') + (u.count > u.sample.length ? '…' : ''))),
      u.canDo && ['checkin', 'journey', 'observe', 'place', 'speech'].includes(u.fill)
        ? h('button.btn.ghost', { onclick: () => open(u.fill) }, t('Do it now'))
        : h('span.small.muted', u.who.length ? t('by ') + u.who.join(' or ') : '')))),
    slot);
  function open(fill) {
    const done = () => { clear(slot); reload(); };
    const fam = { checkin: 'self', journey: 'journey', observe: 'observed', place: 'place' }[fill];
    clear(slot).append(fill === 'speech' ? speechForm(personId, done) : dimensionForm(personId, dims.filter((d) => d.family === fam && d.canWrite), done));
    slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

export function display(d) {
  if (d.text != null) return d.text;
  if (d.value == null) return '—';
  if (d.kind === 'bool') return d.value ? 'yes' : 'no';
  if (d.kind === 'concept') return `${Math.round(d.value * 100)} / 100`;
  if (d.kind === 'core') return `${Math.round(d.value * 100)}%`;
  if (d.kind === 'rating') return `${+Number(d.value).toFixed(1)} of ${d.max}`;
  const v = Math.abs(d.value) < 1 && d.value !== 0 && d.unit?.startsWith('share') ? `${Math.round(d.value * 100)}%` : String(+Number(d.value).toFixed(2));
  const unit = d.value === 1 && d.unit ? d.unit.replace(/speeches$/, 'speech').replace(/([^s])s$/, '$1') : d.unit;
  return unit && !unit.startsWith('share') ? `${v} ${unit}` : v;
}

function table(dims, personId, reload) {
  if (!dims.length) return h('p.empty', t('Nothing to show here for this account.'));
  const groups = [...new Set(dims.map((d) => d.group))];
  const placeSource = dims.find((d) => d.context && d.evidence?.s)?.evidence.s;
  return h('div', groups.map((g) => h('div', { style: 'margin-top:8px' },
    h('h4.small.muted', { style: 'margin:12px 0 6px;text-transform:uppercase;letter-spacing:.06em' }, t(g)),
    placeSource && dims.some((d) => d.group === g && d.context) ? h('p.small.muted', { style: 'margin:0 0 6px' }, t('Source: ') + placeSource) : null,
    h('div.dimrows', dims.filter((d) => d.group === g).map((d) => row(d, personId, reload))))));
}

function row(d, personId, reload) {
  const known = d.value != null || d.text != null;
  return h('div.dimrow' + (known ? '' : '.unknown'),
    h('div.dimlabel', h('span', d.label), d.desc ? h('span.small.muted', { title: d.desc }, ' ⓘ') : null),
    h('div.dimbar', d.norm != null ? h('div.bartrack', h('div.barfill', { style: `width:${Math.round(d.norm * 100)}%;background:${color(d.family)}` })) : null),
    h('div.dimval', known ? h('strong', display(d)) : h('span.muted', t('unknown'))),
    h('div.dimsrc.small.muted',
      known ? [t(SOURCE[d.source] || d.source || ''), d.raters > 1 ? ` · ${d.raters} adults` : '', d.confidence != null && d.confidence < 0.6 ? ` · low confidence` : '', d.at ? ` · ${when(d.at)}` : ''] : '',
      ['family', 'student'].includes(state.user?.role) && known ? h('button.linkish', { onclick: () => correct(d, personId, reload) }, t(' · not right?')) : null),
    showEvidence(d) ? h('blockquote.dimev', d.kind === 'concept' ? `“${d.evidence.s}”` : d.evidence.s) : null,
    d.notes?.length ? h('div.dimnotes', d.notes.map((n) => h('p.small', h('strong', `${n.role}: `), n.text))) : null,
  );
}

/** Quotes only where the words actually reach the concept; place sources are shown once per group. */
const showEvidence = (d) => !!d.evidence?.s && !d.context && (d.kind !== 'concept' || d.value >= 0.4);

async function correct(d, personId, reload) {
  const text = window.prompt(`What should “${d.label}” say? Staff will see your note and fix the record.`);
  if (!text) return;
  try {
    await api(`/api/people/${encodeURIComponent(personId)}/dimensions/${encodeURIComponent(d.key)}/notes`, { method: 'POST', body: { text } });
    status('Thank you. Your note is on the record.');
    reload();
  } catch (e) { status(e.message, true); }
}
