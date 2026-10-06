// Dimension values as ledger events, installed onto Store. Every write is a
// `dim.*` event; the in-memory maps below are a projection of them, persisted
// in snapshot.json alongside entities and fragments.
//
//   dim.set     { rows: [{ e, k, v, t, src, by, conf, at, ev, r }] }   r = rater (observed ratings)
//   dim.define  { key, label, group, sentence, by, at }                 a concept dimension
//   dim.retire  { key }
//   dim.note    { id, e, k, text, by, role, at }                        a correction or comment
import { randomUUID } from 'node:crypto';
import { getDef, conceptDef } from './registry.js';

const MAX_ROWS_PER_EVENT = 5000;

export const dimensionMethods = {
  _dimsInit() {
    if (this.dimValues) return;
    this.dimValues = new Map(); // entityId -> { key: rec }
    this.dimDefs = new Map();   // custom concept key -> def
    this.dimNotes = new Map();  // entityId -> [note]
  },

  _dimsSnapshot() {
    this._dimsInit();
    return { values: [...this.dimValues.entries()], defs: [...this.dimDefs.values()], notes: [...this.dimNotes.entries()] };
  },

  _dimsRestore(s) {
    this._dimsInit();
    if (!s) return;
    for (const [id, recs] of s.values || []) this.dimValues.set(id, recs);
    for (const d of s.defs || []) this.dimDefs.set(d.key, d);
    for (const [id, list] of s.notes || []) this.dimNotes.set(id, list);
  },

  /** Apply one dim.* event to the in-memory maps. */
  _applyDim(ev) {
    this._dimsInit();
    const d = ev.data;
    switch (ev.type) {
      case 'dim.set':
        for (const r of d.rows || []) {
          if (!this.dimValues.has(r.e)) this.dimValues.set(r.e, {});
          const recs = this.dimValues.get(r.e);
          if (r.r) {
            // One rating per adult; the value is their mean.
            const prev = recs[r.k] || { ratings: {} };
            const ratings = { ...(prev.ratings || {}) };
            if (r.v == null) delete ratings[r.r]; else ratings[r.r] = r.v;
            const vals = Object.values(ratings);
            if (!vals.length) { delete recs[r.k]; continue; }
            recs[r.k] = { v: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2), src: 'staff', by: r.r, conf: Math.min(1, 0.45 + 0.2 * vals.length), at: r.at, ratings };
          } else if (r.v == null && r.t == null) delete recs[r.k];
          else recs[r.k] = { v: r.v ?? null, t: r.t ?? null, src: r.src, by: r.by, conf: r.conf ?? 1, at: r.at, ...(r.ev ? { ev: r.ev } : {}) };
        }
        return;
      case 'dim.define': this.dimDefs.set(d.key, conceptDef({ ...d, custom: true })); return;
      case 'dim.retire': {
        this.dimDefs.delete(d.key);
        for (const recs of this.dimValues.values()) delete recs[d.key];
        return;
      }
      case 'dim.note': {
        if (!this.dimNotes.has(d.e)) this.dimNotes.set(d.e, []);
        this.dimNotes.get(d.e).push(d);
        return;
      }
      default:
    }
  },

  /**
   * Write dimension values. rows: [{ entityId, key, v, t, src, by, conf, ev, rater }].
   * Unchanged values are skipped so recomputation does not churn the ledger.
   * Returns the number of rows written.
   */
  setDimensions(rows, actor = 'system') {
    this._dimsInit();
    const at = new Date().toISOString();
    const clean = [];
    for (const r of rows) {
      const def = getDef(r.key, this.dimDefs);
      if (!def) throw new Error(`unknown dimension: ${r.key}`);
      if (!this.entities.has(r.entityId)) throw new Error(`no such entity: ${r.entityId}`);
      const v = r.v == null ? null : Number(r.v);
      if (v != null && !Number.isFinite(v)) throw new Error(`${r.key}: value must be a number`);
      const t = r.t == null ? null : String(r.t).slice(0, 120);
      const prev = this.dimValues.get(r.entityId)?.[r.key];
      if (!r.rater && prev && prev.src === r.src && prev.t === t && (prev.v === v || (v != null && prev.v != null && Math.abs(prev.v - v) < 1e-6))) continue;
      if (!r.rater && !prev && v == null && t == null) continue;
      const row = { e: r.entityId, k: r.key, v, t, src: r.src || 'staff', by: r.by || actor, conf: r.conf ?? 1, at };
      if (r.ev) row.ev = { f: String(r.ev.f || ''), s: String(r.ev.s || '').slice(0, 280) };
      if (r.rater) row.r = String(r.rater);
      clean.push(row);
    }
    for (let i = 0; i < clean.length; i += MAX_ROWS_PER_EVENT) {
      this._apply(this.ledger.append('dim.set', { rows: clean.slice(i, i + MAX_ROWS_PER_EVENT) }, actor));
    }
    return clean.length;
  },

  defineConcept({ key, label, group, sentence }, actor = 'system') {
    this._dimsInit();
    if (getDef(key, this.dimDefs)) throw new Error(`a dimension called ${key} already exists`);
    const data = { key, label: String(label).slice(0, 60), group: String(group || 'Your dimensions').slice(0, 40), sentence: String(sentence).slice(0, 400), by: actor, at: new Date().toISOString() };
    this._apply(this.ledger.append('dim.define', data, actor));
    return this.dimDefs.get(key);
  },

  retireConcept(key, actor = 'system') {
    this._dimsInit();
    if (!this.dimDefs.has(key)) return false;
    this._apply(this.ledger.append('dim.retire', { key }, actor));
    return true;
  },

  addDimensionNote({ entityId, key, text, role }, actor = 'system') {
    this._dimsInit();
    if (!this.entities.has(entityId)) throw new Error(`no such entity: ${entityId}`);
    if (!getDef(key, this.dimDefs)) throw new Error(`unknown dimension: ${key}`);
    const body = String(text || '').trim();
    if (!body) throw new Error('text required');
    const note = { id: randomUUID(), e: entityId, k: key, text: body.slice(0, 1000), by: actor, role: role || 'staff', at: new Date().toISOString() };
    this._apply(this.ledger.append('dim.note', note, actor));
    return note;
  },

  /** Raw dimension records for one entity, core signals merged in from entity.dims. */
  dimensionRecords(entityId) {
    this._dimsInit();
    const e = this.entities.get(entityId);
    const out = { ...(this.dimValues.get(entityId) || {}) };
    for (const [k, v] of Object.entries(e?.dims || {})) if (v != null) out[k] = { v, src: e.metricsSource === 'derived' ? 'derived' : 'import', conf: 1, at: e.updatedAt };
    return out;
  },
};

export function installDimensions(Store) { Object.assign(Store.prototype, dimensionMethods); }
