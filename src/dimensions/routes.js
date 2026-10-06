// HTTP surface for dimensions. Registered by src/server.js if present.
//
// Who may write what is the registry's `writers` list, checked here on the
// server: a family fills in Journey for their own child, a student fills in
// their own check-in, an adult on staff adds an observation as themselves.
// Derived, voice and place values are never typed in by hand.
import { HttpError } from '../api/router.js';
import { requireUser, requireRole, canSeeEntity, projectEntity } from '../api/context.js';
import { FAMILIES, FILLS, PLACE_COLUMNS, allDefs, getDef, coerce, conceptKey } from './registry.js';
import { visibleDefs, completeness, unlocks, rows, questions } from './profile.js';
import { previewConcept, scoreConcepts, VOICE_KINDS } from './concepts.js';
import { deriveAll, derivePlace, deriveVoiceCounts } from './derive.js';
import { parseCsv } from '../import/csv.js';

const studentIds = (store, scope) => [...store.entities.values()].filter((e) => e.type === 'student' && canSeeEntity(scope, e.id)).map((e) => e.id);

export function register(router, { store, sql }) {
  const defsFor = (scope) => visibleDefs(allDefs(store.dimDefs), scope.visibility || []);

  // A student's new words rescore their concept dimensions straight away.
  store.onFragments = async (frags) => {
    const ids = [...new Set(frags.filter((f) => VOICE_KINDS.includes(f.kind) && store.getEntity(f.entityId)?.type === 'student').map((f) => f.entityId))];
    if (!ids.length) return;
    store.setDimensions(await scoreConcepts(store, allDefs(store.dimDefs), { entityIds: ids }), 'voice');
    store.setDimensions(deriveVoiceCounts(store, ids), 'voice');
  };

  router.get('/api/dimensions', (ctx) => {
    requireUser(ctx);
    const defs = defsFor(ctx.scope);
    return { families: FAMILIES, fills: FILLS, total: defs.length, dimensions: defs.map(({ writers, ...d }) => ({ ...d, canWrite: writers.includes(ctx.user.role) })) };
  });

  /** How much of each dimension is known across the students this viewer may see. */
  router.get('/api/dimensions/coverage', (ctx) => {
    requireRole(ctx, 'admin', 'staff');
    const ids = studentIds(store, ctx.scope);
    const defs = defsFor(ctx.scope);
    const known = Object.fromEntries(defs.map((d) => [d.key, 0]));
    for (const id of ids) { const recs = store.dimensionRecords(id); for (const d of defs) { const r = recs[d.key]; if (r && (r.v != null || r.t != null)) known[d.key]++; } }
    return { students: ids.length, coverage: defs.map((d) => ({ key: d.key, family: d.family, label: d.label, known: known[d.key], pct: ids.length ? known[d.key] / ids.length : 0 })) };
  });

  router.get('/api/people/:id/profile', (ctx) => {
    requireUser(ctx);
    const e = store.getEntity(ctx.params.id);
    if (!e || e.type !== 'student' || !canSeeEntity(ctx.scope, e.id)) throw new HttpError(404, 'no such student');
    const defs = defsFor(ctx.scope);
    const recs = store.dimensionRecords(e.id);
    const visible = Object.fromEntries(defs.filter((d) => recs[d.key]).map((d) => [d.key, recs[d.key]]));
    const notes = (store.dimNotes.get(e.id) || []).filter((n) => defs.some((d) => d.key === n.k));
    return {
      person: projectEntity(ctx.scope, e),
      completeness: completeness(defs, visible),
      unlocks: unlocks(defs, visible, ctx.user.role),
      questions: questions(visible, notes),
      dimensions: rows(defs, visible, { role: ctx.user.role, notes }),
    };
  });

  /** Body: { values: { key: raw } }. Each key is checked against its writers. */
  router.put('/api/people/:id/dimensions', (ctx) => {
    requireUser(ctx);
    const e = store.getEntity(ctx.params.id);
    if (!e || e.type !== 'student' || !canSeeEntity(ctx.scope, e.id)) throw new HttpError(404, 'no such student');
    const values = ctx.body?.values;
    if (!values || typeof values !== 'object') throw new HttpError(400, 'values must be an object of key: value');
    const out = [];
    for (const [key, raw] of Object.entries(values)) {
      const def = getDef(key, store.dimDefs);
      if (!def) throw new HttpError(400, `unknown dimension: ${key}`);
      if (!def.writers.includes(ctx.user.role)) throw new HttpError(403, `${def.label} is filled in by ${def.writers.join(' or ') || 'the system'}`);
      let v;
      try { v = coerce(def, raw); } catch (err) { throw new HttpError(400, err.message); }
      const src = { student: 'student', family: 'family' }[ctx.user.role] || 'staff';
      out.push({ entityId: e.id, key, ...v, src, conf: src === 'staff' && def.family === 'self' ? 0.8 : 1, ...(def.family === 'observed' ? { rater: ctx.user.username } : {}) });
    }
    const written = store.setDimensions(out, ctx.user.username);
    if (out.some((r) => r.key === 'homeBlock' || r.key === 'commuteMode') && sql?.db) store.setDimensions(derivePlace(store, sql.db, [e.id]), 'derive');
    return { written };
  });

  router.post('/api/people/:id/dimensions/:key/notes', (ctx) => {
    requireUser(ctx);
    const e = store.getEntity(ctx.params.id);
    if (!e || !canSeeEntity(ctx.scope, e.id)) throw new HttpError(404, 'no such student');
    const def = getDef(ctx.params.key, store.dimDefs);
    if (!def || !(ctx.scope.visibility || []).includes(def.visibility)) throw new HttpError(404, 'no such dimension');
    try { return { note: store.addDimensionNote({ entityId: e.id, key: def.key, text: ctx.body?.text, role: ctx.user.role }, ctx.user.username) }; }
    catch (err) { throw new HttpError(400, err.message); }
  });

  /**
   * Define a concept dimension by one sentence. { label, sentence, group, preview }.
   * preview: true scores it without saving, so a teacher can see who it finds first.
   */
  router.post('/api/dimensions/concepts', async (ctx) => {
    requireRole(ctx, 'admin', 'staff');
    const b = ctx.body || {};
    const sentence = String(b.sentence || '').trim();
    if (sentence.length < 8) throw new HttpError(400, 'write a sentence describing the dimension');
    if (b.preview) {
      const p = await previewConcept(store, sentence, { entityIds: ctx.scope.entityIds, k: 8 });
      return { ...p, top: p.top.map((t) => ({ ...t, person: projectEntity(ctx.scope, store.getEntity(t.entityId)) })) };
    }
    let key;
    try { key = conceptKey(b.label); } catch (err) { throw new HttpError(400, err.message); }
    try { store.defineConcept({ key, label: b.label, group: b.group, sentence }, ctx.user.username); } catch (err) { throw new HttpError(409, err.message); }
    const scored = store.setDimensions(await scoreConcepts(store, [store.dimDefs.get(key)]), ctx.user.username);
    store.setDimensions(deriveVoiceCounts(store), 'voice');
    return { dimension: store.dimDefs.get(key), scored };
  });

  router.delete('/api/dimensions/concepts/:key', (ctx) => {
    requireRole(ctx, 'admin');
    return { retired: store.retireConcept(ctx.params.key, ctx.user.username) };
  });

  router.post('/api/dimensions/derive', async (ctx) => {
    requireRole(ctx, 'admin');
    return { written: await deriveAll({ store, sql, actor: ctx.user.username }) };
  });

  router.get('/api/dimensions/places', (ctx) => {
    requireRole(ctx, 'admin', 'staff');
    return { columns: PLACE_COLUMNS, blocks: sql?.db ? sql.db.prepare('SELECT * FROM place_blocks ORDER BY id').all() : [] };
  });

  /** Public neighborhood data in. Body: { rows: [...] } or { csv: "id,name,lat,lon,walkability,..." }. */
  router.post('/api/dimensions/places', (ctx) => {
    requireRole(ctx, 'admin');
    const b = ctx.body || {};
    const input = b.csv ? parseCsv(b.csv).rows : b.rows;
    if (!Array.isArray(input) || !input.length) throw new HttpError(400, 'send rows or csv');
    const numeric = new Set(['lat', 'lon', ...Object.keys(PLACE_COLUMNS)]);
    const clean = input.map((r) => {
      const o = { id: String(r.id || r.geoid || r.GEOID || '').trim() };
      if (!o.id) throw new HttpError(400, 'every row needs an id (the block group GEOID)');
      for (const [k, v] of Object.entries(r)) if (numeric.has(k) && v !== '' && v != null && Number.isFinite(Number(v))) o[k] = Number(v);
      for (const k of ['name', 'source', 'year']) if (r[k]) o[k] = String(r[k]).slice(0, 200);
      return o;
    });
    store.upsertFacts('place_blocks', clean, ctx.user.username);
    const joined = store.setDimensions(derivePlace(store, sql.db), ctx.user.username);
    return { blocks: clean.length, joined };
  });
}
