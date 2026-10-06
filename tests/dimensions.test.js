// Dimensions: the registry, the profile logic, ledger replay, and the HTTP
// rules about who may fill in what.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BUILTIN, FAMILIES, FILLS, normalize, coerce, conceptKey, getDef } from '../src/dimensions/registry.js';
import { completeness, unlocks, questions, overlapSimilarity, measurable } from '../src/dimensions/profile.js';
import { chunk, calibration, calibrate } from '../src/dimensions/concepts.js';
import { Store } from '../src/core/store.js';
import { createApp } from '../src/server.js';

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

test('registry: about a hundred dimensions, unique keys, every family and fill used', () => {
  assert.ok(BUILTIN.length >= 95, `only ${BUILTIN.length} dimensions`);
  assert.equal(new Set(BUILTIN.map((d) => d.key)).size, BUILTIN.length);
  for (const f of FAMILIES) assert.ok(BUILTIN.some((d) => d.family === f.id), f.id);
  for (const d of BUILTIN) {
    assert.ok(FILLS[d.fill], `${d.key} has an unknown fill`);
    for (const w of d.writers) assert.ok(['admin', 'staff', 'student', 'family'].includes(w));
    if (d.family === 'place') { assert.equal(d.context, true); assert.equal(d.better, null); }
  }
  assert.ok(BUILTIN.filter((d) => d.kind === 'concept').length >= 12);
});

test('registry: normalize, coerce and concept keys', () => {
  assert.equal(normalize(getDef('commuteMinutes'), 0), 1);           // short trip is the favorable end
  assert.equal(normalize(getDef('commuteMinutes'), 90), 0);
  assert.equal(normalize(getDef('curiosity'), 10), 1);
  assert.equal(normalize(getDef('trustedAdult'), 0), 0);
  assert.equal(normalize(getDef('commuteMode'), null), null);
  assert.deepEqual(coerce(getDef('trustedAdult'), 'yes'), { v: 1, t: null });
  assert.deepEqual(coerce(getDef('commuteMode'), 'Bus'), { v: null, t: 'bus' });
  assert.throws(() => coerce(getDef('stress'), 9), /between 1 and 5/);
  assert.throws(() => coerce(getDef('c.climate'), 0.5), /computed/);
  assert.equal(conceptKey('Bullying and being targeted'), 'c.bullyingAndBeingTargeted');
});

test('profile: completeness, unlocks, and questions that never come from place', () => {
  const defs = BUILTIN;
  const recs = { gpa: { v: 0.5 }, commuteMinutes: { v: 60, conf: 1 }, tardyRate: { v: 0.2, conf: 1 }, trustedAdult: { v: 0, conf: 1 } };
  const c = completeness(defs, recs);
  assert.equal(c.known, 4);
  assert.equal(c.total, defs.length);
  const u = unlocks(defs, recs, 'family');
  assert.ok(u.find((x) => x.fill === 'journey').canDo);
  assert.ok(!u.find((x) => x.fill === 'observe').canDo);
  const keys = questions(recs).map((q) => q.key);
  assert.ok(keys.includes('longCommute') && keys.includes('noTrustedAdult'));
  const placeOnly = Object.fromEntries(defs.filter((d) => d.family === 'place' && d.kind === 'number').map((d) => [d.key, { v: d.better === null ? d.max : d.min }]));
  assert.deepEqual(questions(placeOnly), []);
});

test('similarity counts only shared dimensions, excludes place, and shrinks small overlaps', () => {
  const defs = BUILTIN;
  const a = measurable(defs, { walkability: { v: 20 }, curiosity: { v: 9 } });
  assert.ok(!('walkability' in a));
  const big = Object.fromEntries(Array.from({ length: 30 }, (_, i) => ['k' + i, 0.5]));
  const small = Object.fromEntries(Array.from({ length: 8 }, (_, i) => ['k' + i, 0.5]));
  assert.equal(overlapSimilarity(big, Object.fromEntries(Array.from({ length: 5 }, (_, i) => ['k' + i, 0.5]))), null);
  assert.ok(overlapSimilarity(big, big).score > overlapSimilarity(small, small).score);
  assert.equal(overlapSimilarity(big, big).shared, 30);
});

test('chunking keeps short text whole and splits long speeches on sentences', () => {
  assert.deepEqual(chunk('Short and sweet.'), ['Short and sweet.']);
  const speech = Array.from({ length: 12 }, (_, i) => `Sentence number ${i} is about the crosswalk on Fifth Street and the cars.`).join(' ');
  const parts = chunk(speech);
  assert.ok(parts.length >= 3);
  assert.equal(parts.join(' '), speech);
  assert.ok(parts.every((p) => /[.!?]$/.test(p)));
});

test('calibration: the typical student is 0, clear matches reach 1, noise stays low', () => {
  const bests = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.002);
  const cal = calibration(bests);
  assert.equal(calibrate(cal.base, cal), 0);
  assert.equal(calibrate(0.7, cal), 1);
  assert.ok(calibrate(0.2, cal) <= 0.25);
});

test('dimension events live in the ledger and replay into a fresh store', async () => {
  const dir = tmp('dims-store-');
  const s = await new Store(dir).open();
  s.upsertEntity({ id: 'STU-1', type: 'student', grade: 7 });
  assert.equal(s.setDimensions([{ entityId: 'STU-1', key: 'commuteMinutes', v: 40, src: 'family' }]), 1);
  assert.equal(s.setDimensions([{ entityId: 'STU-1', key: 'commuteMinutes', v: 40, src: 'family' }]), 0, 'unchanged values are not rewritten');
  s.setDimensions([{ entityId: 'STU-1', key: 'curiosity', v: 6, src: 'staff', rater: 'a' }, { entityId: 'STU-1', key: 'curiosity', v: 10, src: 'staff', rater: 'b' }]);
  assert.equal(s.dimValues.get('STU-1').curiosity.v, 8);
  s.defineConcept({ key: 'c.test', label: 'Test', sentence: 'A test concept sentence.' });
  s.addDimensionNote({ entityId: 'STU-1', key: 'commuteMinutes', text: 'It is 50 now.', role: 'family' });
  assert.throws(() => s.setDimensions([{ entityId: 'STU-1', key: 'nope', v: 1 }]), /unknown dimension/);
  const again = await new Store(dir).open();
  assert.deepEqual(again.dimValues.get('STU-1').commuteMinutes.v, 40);
  assert.equal(again.dimValues.get('STU-1').curiosity.v, 8);
  assert.ok(again.dimDefs.has('c.test'));
  assert.equal(again.dimNotes.get('STU-1')[0].text, 'It is 50 now.');
  again.retireConcept('c.test');
  assert.ok(!again.dimDefs.has('c.test'));
  assert.ok(again.ledger.verify().ok);
});

test('HTTP: who may fill in what, what each role sees, and SQL scope', async () => {
  const dataDir = tmp('dims-api-');
  const app = await createApp({ dataDir, warm: false });
  const server = await app.router.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const jars = {};
  const call = async (who, method, url, body) => {
    const headers = { 'content-type': 'application/json', ...(jars[who] ? { cookie: jars[who] } : {}) };
    const res = await fetch(base + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie'); if (sc) jars[who] = sc.split(';')[0];
    return { status: res.status, json: await res.json().catch(() => null) };
  };
  try {
    app.store.upsertEntity({ id: 'SCH-A', type: 'school', name: 'A', lat: 36.9, lon: -120.1 });
    for (const id of ['STU-1', 'STU-2']) app.store.upsertEntity({ id, type: 'student', grade: 8, schoolId: 'SCH-A', metrics: { gpa: 3, attendancePct: 90 } });
    await call('admin', 'POST', '/api/auth/bootstrap', { username: 'admin', password: 'test-admin-pw' });
    await call('admin', 'POST', '/api/auth/login', { username: 'admin', password: 'test-admin-pw' });
    for (const u of [{ username: 'fam', password: 'test-family', role: 'family', entityIds: ['STU-1'] }, { username: 'kid', password: 'test-student', role: 'student', entityId: 'STU-1' }, { username: 't1', password: 'test-staff1', role: 'staff' }, { username: 't2', password: 'test-staff2', role: 'staff' }]) {
      await call('admin', 'POST', '/api/users', u);
      await call(u.username, 'POST', '/api/auth/login', { username: u.username, password: u.password });
    }
    const put = (who, id, values) => call(who, 'PUT', `/api/people/${id}/dimensions`, { values });
    assert.equal((await put('fam', 'STU-1', { commuteMinutes: 50, commuteMode: 'transit' })).status, 200);
    assert.equal((await put('fam', 'STU-1', { curiosity: 9 })).status, 403);
    assert.equal((await put('fam', 'STU-2', { commuteMinutes: 5 })).status, 404);
    assert.equal((await put('kid', 'STU-1', { trustedAdult: 'no', belonging: 2 })).status, 200);
    assert.equal((await put('kid', 'STU-1', { commuteMinutes: 5 })).status, 403);
    assert.equal((await put('kid', 'STU-1', { stress: 9 })).status, 400);
    assert.equal((await put('t1', 'STU-1', { curiosity: 6 })).status, 200);
    assert.equal((await put('t2', 'STU-1', { curiosity: 10 })).status, 200);
    assert.equal((await put('admin', 'STU-1', { tardyRate: 0.5 })).status, 403, 'derived values are never typed in');

    const prof = (await call('fam', 'GET', '/api/people/STU-1/profile')).json;
    const cur = prof.dimensions.find((d) => d.key === 'curiosity');
    assert.equal(cur.value, 8); assert.equal(cur.raters, 2);
    assert.ok(prof.questions.some((q) => q.key === 'noTrustedAdult'));
    assert.equal((await call('fam', 'GET', '/api/people/STU-2/profile')).status, 404);

    const places = await call('admin', 'POST', '/api/dimensions/places', { csv: 'id,name,lat,lon,walkability,heatDays,source,year\n069990000011,Test block,36.91,-120.11,14,30,test data,2025' });
    assert.equal(places.json.blocks, 1);
    assert.equal((await put('t1', 'STU-1', { homeBlock: '069990000011' })).status, 200);
    const after = (await call('admin', 'GET', '/api/people/STU-1/profile')).json.dimensions;
    assert.equal(after.find((d) => d.key === 'walkability').value, 14);
    assert.ok(after.find((d) => d.key === 'distanceKm').value > 0);
    assert.equal(after.find((d) => d.key === 'commuteMinutes').value, 50, 'a family-reported commute is never overwritten by an estimate');

    const sql = (who, q) => call(who, 'POST', '/api/sql/query', { sql: q });
    assert.deepEqual((await sql('fam', 'SELECT DISTINCT entityId FROM student_dimensions')).json.rows, [{ entityId: 'STU-1' }]);
    assert.ok((await sql('admin', "SELECT count(*) n FROM dimension_catalog WHERE family = 'place'")).json.rows[0].n >= 12);
    assert.equal((await sql('admin', "SELECT count(*) n FROM student_dimensions WHERE key = 'curiosity'")).json.rows[0].n, 2, 'one row per rater');
  } finally { app.close(); server.close(); }
});

test('a speech is split into passages, found by meaning, and scored with the passage as evidence', async () => {
  const { scoreConcepts } = await import('../src/dimensions/concepts.js');
  const s = await new Store(tmp('dims-voice-')).open();
  for (let i = 1; i <= 6; i++) s.upsertEntity({ id: 'STU-' + i, type: 'student', grade: 9 });
  const speech = 'Good afternoon. My name is Ana. Every morning I cross six lanes of traffic to get to school, and the walk signal lasts eleven seconds. '
    + 'A boy from our school was hit by a car last year at the corner where I wait for the bus. We counted forty drivers who did not stop at the crosswalk in one hour. '
    + 'I am asking the city to add a crossing guard and a longer walk signal at Fifth and Main. Thank you for listening to us today.';
  const [f] = await s.addFragments([{ entityId: 'STU-1', kind: 'speech', visibility: 'school', text: speech }]);
  assert.ok(f.passages >= 2, 'long speech split into passages');
  await s.addFragments([2, 3, 4, 5, 6].map((n) => ({ entityId: 'STU-' + n, kind: 'self', visibility: 'school', text: `I like ${['drawing', 'soccer', 'baking', 'chess', 'music'][n - 2]} and my friends.` })));
  await s.addFragments([{ entityId: 'STU-2', kind: 'self', visibility: 'private', text: 'Dangerous crosswalks and traffic scare me on the way to school.' }]);
  const rows = await scoreConcepts(s, [getDef('c.streets')]);
  const by = Object.fromEntries(rows.map((r) => [r.entityId, r]));
  assert.ok(by['STU-1'].v > 0.8, `speech scores high on streets (${by['STU-1'].v})`);
  assert.match(by['STU-1'].ev.s, /crosswalk|traffic|walk signal/);
  assert.ok(by['STU-2'].v < 0.3, 'a private journal never raises a score staff can see');
  const hits = await s.semanticSearch('crossing guard at the dangerous corner', { k: 3 });
  assert.equal(hits[0].entity.id, 'STU-1');
  assert.ok(hits[0].fragments[0].match, 'search returns the matching passage');
});
