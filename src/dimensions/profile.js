// A student's dimensional profile: what is known, how sure we are, what would
// fill the gaps, and which questions the known values raise for a person.
// Pure functions over registry defs and dimension records; no I/O.
import { FAMILIES, FILLS, normalize } from './registry.js';

const MEASURABLE = new Set(['core', 'number', 'rating', 'bool', 'concept']);

/** Defs a viewer may see, given their visibility ceiling (e.g. ['school','staff']). */
export const visibleDefs = (defs, visibility) => defs.filter((d) => visibility.includes(d.visibility));

/**
 * Completeness per family and overall. `confidence` weighs each known value
 * by its own confidence, the way PitchIntel reports a valuation.
 */
export function completeness(defs, recs) {
  const fam = {};
  let known = 0, weight = 0;
  for (const d of defs) {
    const f = (fam[d.family] ||= { known: 0, total: 0 });
    f.total++;
    const r = recs[d.key];
    if (r && (r.v != null || r.t != null)) { f.known++; known++; weight += r.conf ?? 1; }
  }
  const families = FAMILIES.filter((f) => fam[f.id]).map((f) => ({ ...f, ...fam[f.id], pct: fam[f.id].total ? fam[f.id].known / fam[f.id].total : 0 }));
  return { known, total: defs.length, pct: defs.length ? known / defs.length : 0, confidence: defs.length ? weight / defs.length : 0, families };
}

/** The gaps, grouped by the action that would fill them, biggest first. */
export function unlocks(defs, recs, role) {
  const by = {};
  for (const d of defs) {
    const r = recs[d.key];
    if (r && (r.v != null || r.t != null)) continue;
    (by[d.fill] ||= []).push(d);
  }
  return Object.entries(by).map(([fill, list]) => ({
    fill, label: FILLS[fill]?.label || fill, who: FILLS[fill]?.who || [], canDo: (FILLS[fill]?.who || []).includes(role),
    count: list.length, keys: list.map((d) => d.key), sample: list.slice(0, 4).map((d) => d.label),
  })).sort((a, b) => b.count - a.count);
}

/** One row per visible def, with value, normalized value and provenance. */
export function rows(defs, recs, { role, notes = [] } = {}) {
  return defs.map((d) => {
    const r = recs[d.key] || null;
    const nts = notes.filter((n) => n.k === d.key);
    return {
      key: d.key, label: d.label, family: d.family, group: d.group, kind: d.kind, unit: d.unit || null, desc: d.desc || null,
      min: d.min ?? null, max: d.max ?? null, better: d.better, levels: d.levels || null, context: !!d.context, custom: !!d.custom,
      value: r?.v ?? null, text: r?.t ?? null, norm: r ? normalize(d, r.v) : null,
      source: r?.src || null, by: r?.by || null, confidence: r?.conf ?? null, at: r?.at || null, evidence: r?.ev || null,
      raters: r?.ratings ? Object.keys(r.ratings).length : null,
      canWrite: d.writers.includes(role), notes: nts,
    };
  });
}

const val = (recs, k) => recs[k]?.v ?? null;
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * Questions for a person. Never verdicts, and never from Place: the
 * neighborhood is context for the adults, not a reason to look at a child.
 */
export function questions(recs, notes = []) {
  const out = [];
  const q = (key, text, why) => out.push({ key, text, why });
  const minutes = val(recs, 'commuteMinutes'), tardy = val(recs, 'tardyRate'), att = val(recs, 'attendance');
  if (minutes != null && minutes >= 45 && ((tardy != null && tardy >= 0.1) || (att != null && att < 0.92)))
    q('longCommute', 'A long trip to school and late or missed mornings. Would a different route, bus or start time help?', `${Math.round(minutes)} minutes each way`);
  if (val(recs, 'trustedAdult') === 0) q('noTrustedAdult', 'They told us there is no adult at school they trust. Who could become that person?', 'From their check-in');
  if (val(recs, 'belonging') != null && val(recs, 'belonging') <= 2) q('lowBelonging', 'They do not feel they belong here yet. Who could they be connected with?', 'From their check-in');
  const load = (val(recs, 'workHours') || 0) + (val(recs, 'caretakingHours') || 0);
  if (load >= 20) q('heavyLoad', 'A lot of hours working or caring for family. Does the school week leave room for them?', `${Math.round(load)} hours a week`);
  if (val(recs, 'sleepHours') != null && val(recs, 'sleepHours') < 6.5) q('shortSleep', 'Under six and a half hours of sleep on school nights. What is happening in the evenings?', `${val(recs, 'sleepHours')} hours`);
  const strengths = ['persistence', 'curiosity', 'creativity', 'handsOnSkill', 'leadership'].map((k) => val(recs, k)).filter((v) => v != null);
  const gpa = val(recs, 'gpa');
  if (strengths.length >= 2 && avg(strengths) >= 7.5 && gpa != null && gpa < 0.6)
    q('unseenStrength', 'Adults see real strengths here that the grades do not show. Where could this student show them?', 'Observed strengths against grades');
  if (val(recs, 'publicSpeaking') != null && val(recs, 'publicSpeaking') >= 9 && !val(recs, 'speechesGiven') && val(recs, 'writtenPieces') != null)
    q('untappedVoice', 'A strong speaker with no speech on record. Is there a Soapbox topic they would take on?', 'Observed public speaking');
  for (const n of notes.filter((x) => ['family', 'student'].includes(x.role)))
    q('correction', `A ${n.role} added a note on “${n.k}”. Please read it and update the record if they are right.`, n.text.slice(0, 140));
  return out;
}

/** Normalized vector of measurable, non-context dims. */
export function measurable(defs, recs) {
  const out = {};
  for (const d of defs) {
    if (!MEASURABLE.has(d.kind) || d.context) continue;
    const n = normalize(d, recs[d.key]?.v);
    if (n != null) out[d.key] = n;
  }
  return out;
}

/**
 * Similarity on the dimensions two students both have. Score is 1 minus the
 * root-mean-square difference, shrunk toward zero when the overlap is small,
 * so a match on 6 shared dimensions never outranks a match on 60.
 */
export function overlapSimilarity(a, b, { minShared = 8 } = {}) {
  let n = 0, sq = 0;
  for (const k in a) if (k in b) { n++; sq += (a[k] - b[k]) ** 2; }
  if (n < minShared) return null;
  return { score: (1 - Math.sqrt(sq / n)) * (n / (n + 6)), shared: n };
}
