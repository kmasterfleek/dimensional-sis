// Dimensions computed on this machine from data the school already holds:
// attendance and incident rows, the student's own words, and public
// neighborhood data joined through the home block group. Nothing here leaves
// the building; place data is downloaded once and joined locally.
import { allDefs, PLACE_COLUMNS, COMMUTE_MODES } from './registry.js';
import { scoreConcepts, VOICE_KINDS } from './concepts.js';

const r3 = (x) => +x.toFixed(3);

/** Attendance detail and incident variety, per student, from the SQL projection. */
export function deriveRecord(db, entityIds = null) {
  const rows = [];
  const want = entityIds ? new Set(entityIds) : null;
  const att = db.prepare('SELECT studentSourcedId AS id, date, code FROM attendance ORDER BY studentSourcedId, date').all();
  const by = new Map();
  for (const a of att) { if (want && !want.has(a.id)) continue; if (!by.has(a.id)) by.set(a.id, []); by.get(a.id).push(a); }
  for (const [id, days] of by) {
    if (days.length < 5) continue;
    const absent = (c) => c === 'absent' || c === 'excused';
    const absences = days.filter((d) => absent(d.code));
    let streak = 0, best = 0;
    for (const d of days) { streak = absent(d.code) ? streak + 1 : 0; best = Math.max(best, streak); }
    const recent = days.slice(-10);
    rows.push({ entityId: id, key: 'tardyRate', v: r3(days.filter((d) => d.code === 'tardy').length / days.length), src: 'derived', conf: Math.min(1, days.length / 30) });
    rows.push({ entityId: id, key: 'longestAbsenceStreak', v: best, src: 'derived', conf: Math.min(1, days.length / 30) });
    rows.push({ entityId: id, key: 'recentAttendance', v: r3(recent.filter((d) => !absent(d.code)).length / recent.length), src: 'derived', conf: 1 });
    if (absences.length >= 2) {
      const mondays = absences.filter((d) => new Date(d.date + 'T12:00:00Z').getUTCDay() === 1).length;
      rows.push({ entityId: id, key: 'mondayAbsenceShare', v: r3(mondays / absences.length), src: 'derived', conf: Math.min(1, absences.length / 6) });
    }
  }
  for (const r of db.prepare('SELECT studentSourcedId AS id, count(DISTINCT type) AS n FROM discipline_incidents GROUP BY studentSourcedId').all()) {
    if (want && !want.has(r.id)) continue;
    rows.push({ entityId: r.id, key: 'incidentVariety', v: r.n, src: 'derived', conf: 1 });
  }
  return rows;
}

/** How much of their own voice is on record. voiceTopics needs concept scores. */
export function deriveVoiceCounts(store, entityIds = null) {
  const rows = [];
  const ids = entityIds || [...store.entities.values()].filter((e) => e.type === 'student').map((e) => e.id);
  for (const id of ids) {
    const frags = store.getFragments(id, { visibility: ['school'] }).filter((f) => VOICE_KINDS.includes(f.kind));
    const speeches = frags.filter((f) => f.kind === 'speech').length;
    if (frags.length) rows.push({ entityId: id, key: 'writtenPieces', v: frags.length, src: 'derived', conf: 1 });
    if (speeches) rows.push({ entityId: id, key: 'speechesGiven', v: speeches, src: 'derived', conf: 1 });
    const recs = store.dimValues.get(id) || {};
    const concepts = Object.entries(recs).filter(([k, r]) => k.startsWith('c.') && r.v >= 0.5).length;
    if (Object.keys(recs).some((k) => k.startsWith('c.'))) rows.push({ entityId: id, key: 'voiceTopics', v: concepts, src: 'derived', conf: 1 });
  }
  return rows;
}

const haversineKm = (a, b) => {
  const toRad = (x) => (x * Math.PI) / 180, R = 6371;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Join each student's home block group to the public place table, compute the
 * straight-line distance to their school, and estimate a commute when the
 * family has not told us one (low confidence, and replaced the moment they do).
 */
export function derivePlace(store, db, entityIds = null) {
  const rows = [];
  const blocks = new Map(db.prepare('SELECT * FROM place_blocks').all().map((b) => [b.id, b]));
  if (!blocks.size) return rows;
  const ids = entityIds || [...store.dimValues.keys()];
  for (const id of ids) {
    const recs = store.dimValues.get(id) || {};
    const block = blocks.get(recs.homeBlock?.t);
    if (!block) continue;
    const at = block.year ? `public data, ${block.year}` : 'public data';
    for (const k of Object.keys(PLACE_COLUMNS)) if (block[k] != null) rows.push({ entityId: id, key: k, v: block[k], src: 'public', conf: 0.85, ev: { f: block.id, s: `${block.name || block.id} · ${block.source || at}` } });
    const school = store.getEntity(store.getEntity(id)?.schoolId);
    if (school?.lat != null && school?.lon != null && block.lat != null) {
      const km = r3(haversineKm(block, school));
      rows.push({ entityId: id, key: 'distanceKm', v: km, src: 'derived', conf: 0.7 });
      const reported = recs.commuteMinutes && recs.commuteMinutes.src !== 'estimated';
      if (!reported) {
        const speed = COMMUTE_MODES[recs.commuteMode?.t] || (km < 1.6 ? COMMUTE_MODES.walk : COMMUTE_MODES.car);
        rows.push({ entityId: id, key: 'commuteMinutes', v: Math.min(90, Math.round((km * 1.3 / speed) * 60 + 4)), src: 'estimated', conf: 0.35 });
      }
    }
  }
  return rows;
}

/** Recompute everything derived, for some or all students. Returns rows written per kind. */
export async function deriveAll({ store, sql, entityIds = null, actor = 'derive' }) {
  const out = {};
  out.record = sql?.db ? store.setDimensions(deriveRecord(sql.db, entityIds), actor) : 0;
  out.place = sql?.db ? store.setDimensions(derivePlace(store, sql.db, entityIds), actor) : 0;
  out.concepts = store.setDimensions(await scoreConcepts(store, allDefs(store.dimDefs), { entityIds }), actor);
  out.voice = store.setDimensions(deriveVoiceCounts(store, entityIds), actor);
  return out;
}
