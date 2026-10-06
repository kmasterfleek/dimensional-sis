// Voice: long writing is split into passages so a five-minute speech is not
// squeezed into one vector, and concept dimensions score a student's own
// words against a sentence by meaning.
//
// Only fragments shared with the school ('school' visibility) of the kinds a
// student writes themselves count toward a concept. A private journal never
// raises a score that staff can see.
import { embedQuery } from '../core/embed.js';

export const CHUNKED_KINDS = new Set(['speech', 'artifact', 'self']);
export const VOICE_KINDS = ['self', 'speech', 'artifact'];
const PASSAGE_CHARS = 360;
const MIN_CHUNK_CHARS = 420; // shorter texts stay one vector

/** Split text into passages of whole sentences, about PASSAGE_CHARS each. Deterministic. */
export function chunk(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length < MIN_CHUNK_CHARS) return [t];
  const sentences = t.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) || [t];
  const out = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > PASSAGE_CHARS) { out.push(cur.trim()); cur = ''; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export const passageIds = (f) => (f.passages > 1 ? Array.from({ length: f.passages }, (_, i) => `pass:${f.id}:${i}`) : [`frag:${f.id}`]);

/**
 * Cosine -> 0..1, calibrated per concept against the whole student body: the
 * typical student's best match is the baseline (0), the top ~2% reach 1, and
 * an absolute gate keeps a concept nobody writes about from inflating noise.
 */
export function calibration(bests) {
  const xs = [...bests].sort((a, b) => a - b);
  if (!xs.length) return { base: 0.2, top: 0.5 };
  const q = (p) => xs[Math.min(xs.length - 1, Math.floor(p * xs.length))];
  return { base: q(0.5), top: Math.max(q(0.98), q(0.5) + 0.25) };
}
export const calibrate = (cos, { base, top }) => Math.min(1, Math.max(0, (cos - base) / (top - base)), Math.max(0, (cos - 0.15) / 0.2));
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

/** Voice passages for every student: Map entityId -> [{ vec, fragmentId, text }]. */
export async function voicePassages(store, entityIds = null) {
  store._vecCache ||= new Map();
  const want = entityIds ? new Set(entityIds) : null;
  const out = new Map();
  for (const f of store.fragments.values()) {
    if (want && !want.has(f.entityId)) continue;
    if (f.visibility !== 'school' || !VOICE_KINDS.includes(f.kind)) continue;
    const e = store.entities.get(f.entityId);
    if (e?.type !== 'student') continue;
    const texts = f.passages > 1 ? chunk(f.text) : [f.text];
    const ids = passageIds(f);
    for (let i = 0; i < ids.length; i++) {
      let vec = store._vecCache.get(ids[i]);
      if (!vec) {
        const r = await store.vec.get(ids[i]);
        if (!r?.vector) continue;
        vec = Float32Array.from(r.vector);
        store._vecCache.set(ids[i], vec);
      }
      if (!out.has(f.entityId)) out.set(f.entityId, []);
      out.get(f.entityId).push({ vec, fragmentId: f.id, text: texts[i] || f.text });
    }
  }
  return out;
}

/**
 * Score concept defs for students. Returns dimension rows ready for
 * store.setDimensions. A student with no shared voice gets no row: unknown,
 * not zero.
 */
function bestMatch(vec, list) {
  let best = -1, at = null;
  for (const p of list) { const c = dot(vec, p.vec); if (c > best) { best = c; at = p; } }
  return { best, at };
}

/**
 * Score concept defs for students. Returns dimension rows ready for
 * store.setDimensions. A student with no shared voice gets no row: unknown,
 * not zero. Calibration always uses every student, even when only a few are
 * being rescored.
 */
export async function scoreConcepts(store, defs, { entityIds = null } = {}) {
  const concepts = defs.filter((d) => d.kind === 'concept');
  if (!concepts.length) return [];
  const voice = await voicePassages(store);
  const want = entityIds ? new Set(entityIds) : null;
  const rows = [];
  for (const def of concepts) {
    const vec = await embedQuery(def.sentence);
    const scored = [...voice].map(([entityId, list]) => ({ entityId, list, ...bestMatch(vec, list) }));
    const cal = calibration(scored.map((x) => x.best));
    for (const x of scored) {
      if (want && !want.has(x.entityId)) continue;
      rows.push({ entityId: x.entityId, key: def.key, v: +calibrate(x.best, cal).toFixed(3), src: 'concept', conf: +Math.min(1, 0.4 + 0.12 * x.list.length).toFixed(2), ev: { f: x.at.fragmentId, s: x.at.text } });
    }
  }
  return rows;
}

/** Students whose own words best match an arbitrary sentence (for previewing a new concept). */
export async function previewConcept(store, sentence, { entityIds = null, k = 10 } = {}) {
  const voice = await voicePassages(store);
  const vec = await embedQuery(sentence);
  const all = [...voice].map(([entityId, list]) => ({ entityId, ...bestMatch(vec, list) }));
  const cal = calibration(all.map((x) => x.best));
  const want = entityIds ? new Set(entityIds) : null;
  const scored = all.filter((x) => !want || want.has(x.entityId)).map((x) => ({ entityId: x.entityId, score: +calibrate(x.best, cal).toFixed(3), snippet: x.at.text }));
  scored.sort((a, b) => b.score - a.score);
  return { students: scored.length, reached: scored.filter((s) => s.score >= 0.5).length, top: scored.slice(0, k) };
}
