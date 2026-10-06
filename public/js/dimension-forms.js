// Forms that fill dimensions in: one generic form driven by the registry
// (check-in, journey, observations, home neighborhood) and a speech form.
// The server re-checks every key against who may write it.
import { api, h, status } from '/app.js';
import { t } from '/js/edition.js';

const TITLES = {
  self: ['A five-minute check-in', 'Answer for yourself. There are no right answers; this helps the adults around you notice what you need.'],
  journey: ['Getting to school', 'How the trip works on a normal day. It helps us see why a morning might go wrong.'],
  observed: ['What you see', 'Rate what you have actually seen, 1 to 10. Your ratings are averaged with other adults’, and the student and family can read them.'],
  place: ['Home neighborhood', 'The census block group of home, never a street address. Public data about the neighborhood is joined to it here, on this machine.'],
};

function input(d) {
  const id = 'dim-' + d.key;
  const cur = d.text ?? d.value;
  let el;
  if (d.kind === 'rating' || (d.kind === 'number' && d.max - d.min <= 12 && Number.isInteger(d.min))) {
    el = h('select', { id }, h('option', { value: '' }, '—'),
      Array.from({ length: d.max - d.min + 1 }, (_, i) => d.min + i).map((n) => h('option', { value: String(n), selected: cur === n }, String(n))));
  } else if (d.kind === 'number') {
    el = h('input', { id, type: 'number', min: d.min, max: d.max, step: 'any', value: cur ?? '' });
  } else if (d.kind === 'bool') {
    el = h('select', { id }, h('option', { value: '' }, '—'), h('option', { value: 'yes', selected: cur === 1 }, t('Yes')), h('option', { value: 'no', selected: cur === 0 }, t('No')));
  } else if (d.kind === 'category') {
    el = h('select', { id }, h('option', { value: '' }, '—'), (d.levels || []).map((l) => h('option', { value: l, selected: cur === l }, l)));
  } else if (d.key === 'homeBlock') {
    el = h('select', { id }, h('option', { value: cur ?? '' }, cur || '—'));
    api('/api/dimensions/places').then(({ blocks }) => {
      el.replaceChildren(h('option', { value: '' }, '—'), blocks.map((b) => h('option', { value: b.id, selected: cur === b.id }, `${b.name || b.id} · ${b.id}`)));
      el.dataset.initial = el.value;
    }).catch(() => {});
  } else {
    el = h('input', { id, type: d.unit === 'time' ? 'time' : 'text', value: cur ?? '', maxlength: 120 });
  }
  el.dataset.key = d.key;
  el.dataset.initial = el.value;
  return h('div.field', h('label', { for: id }, t(d.label), d.unit ? h('span.small.muted', ` (${d.unit})`) : null), el);
}

/** A form over the writable dims of one family. Sends only fields that changed. */
export function dimensionForm(personId, dims, onDone) {
  if (!dims.length) return h('p.notice', t('This account cannot fill these in.'));
  const fam = dims[0].family;
  const [title, lede] = TITLES[fam] || ['Fill in', ''];
  const err = h('p.err', { role: 'alert' });
  const fields = dims.filter((d) => !['concept', 'core'].includes(d.kind)).map(input);
  const form = h('form.card', { style: 'margin-top:12px', onsubmit: submit },
    h('h3', { style: 'margin-top:0' }, t(title)), h('p.small.muted', t(lede)),
    h('div.grid.three', fields), err,
    h('div.row', { style: 'gap:8px' }, h('button.btn', { type: 'submit' }, t('Save')), h('button.btn.ghost', { type: 'button', onclick: () => onDone() }, t('Cancel'))));
  async function submit(e) {
    e.preventDefault();
    const values = {};
    for (const el of form.querySelectorAll('[data-key]')) if (el.value !== el.dataset.initial) values[el.dataset.key] = el.value === '' ? null : el.value;
    if (!Object.keys(values).length) { onDone(); return; }
    try {
      const r = await api(`/api/people/${encodeURIComponent(personId)}/dimensions`, { method: 'PUT', body: { values } });
      status(t(`${r.written} dimension${r.written === 1 ? '' : 's'} saved.`));
      onDone();
    } catch (x) { err.textContent = x.message; }
  }
  return form;
}

/** A speech in the student's own words. Long speeches are split into passages on the server. */
export function speechForm(personId, onDone) {
  const title = h('input', { id: 'sp-title', type: 'text', maxlength: 140, placeholder: 'What is it called?' });
  const text = h('textarea', { id: 'sp-text', rows: 10, placeholder: 'Paste or type the speech the way it was given.' });
  const err = h('p.err', { role: 'alert' });
  const form = h('form.card', { style: 'margin-top:12px', onsubmit: submit },
    h('h3', { style: 'margin-top:0' }, t('A speech in their own words')),
    h('p.small.muted', t('Shared with the student, their family and staff. Its meaning is read on this machine and fills in the Voice dimensions; the words never leave the building.')),
    h('div.field', h('label', { for: 'sp-title' }, t('Title')), title),
    h('div.field', h('label', { for: 'sp-text' }, t('The speech')), text), err,
    h('div.row', { style: 'gap:8px' }, h('button.btn', { type: 'submit' }, t('Add the speech')), h('button.btn.ghost', { type: 'button', onclick: () => onDone() }, t('Cancel'))));
  async function submit(e) {
    e.preventDefault();
    if (text.value.trim().length < 40) { err.textContent = t('A speech needs a few sentences.'); return; }
    try {
      await api(`/api/people/${encodeURIComponent(personId)}/fragments`, { method: 'POST', body: { kind: 'speech', title: title.value, text: text.value, visibility: 'school' } });
      status(t('Speech added. Its Voice dimensions are updated.'));
      onDone();
    } catch (x) { err.textContent = x.message; }
  }
  return form;
}
