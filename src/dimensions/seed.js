// Seeds the dimension families for the synthetic demo district. Coverage is
// deliberately partial (a real district never has everything), so every
// student shows what is known, how sure we are, and what would fill the rest.
//
// The neighborhood table is synthetic, shaped like public block-group data
// (EPA Smart Location / National Walkability Index, CalEnviroScreen, ACS
// broadband). The GEOIDs use county code 999, which does not exist.
import { makeSpeech } from './seed-speeches.js';
import { deriveAll } from './derive.js';

const CENTER = { lat: 36.9, lon: -120.1 };
const KM_LAT = 1 / 111, KM_LON = 1 / 89;
const hash = (i, salt = 0) => (((i + 1) * 2654435761) ^ (salt * 40503)) >>> 0;
const unit = (i, salt) => (hash(i, salt) % 10007) / 10007;           // deterministic 0..1
const jitter = (i, salt, amp) => (unit(i, salt) - 0.5) * 2 * amp;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const r1 = (x) => Math.round(x * 10) / 10;

const AREAS = ['Riverside', 'Eastgate', 'Orchard', 'Northfield', 'Old Town', 'Lakeview'];

/** 24 block groups on a 6x4 grid; advantage rises toward the north-west. */
export function placeBlocks() {
  const out = [];
  for (let gx = 0; gx < 6; gx++) for (let gy = 0; gy < 4; gy++) {
    const i = gx * 4 + gy;
    const adv = clamp(0.15 + 0.13 * (5 - gx) * 0.6 + 0.12 * gy + jitter(i, 1, 0.12), 0, 1);
    const central = 1 - Math.hypot(gx - 2.5, gy - 1.5) / 3.2;
    out.push({
      id: `06999${String(100 + gx * 10 + gy).padStart(6, '0')}${1 + (gy % 3)}`,
      name: `${AREAS[gx]} ${gy + 1}`,
      lat: +(CENTER.lat + (gy - 1.5) * 2.2 * KM_LAT).toFixed(5), lon: +(CENTER.lon + (gx - 2.5) * 1.8 * KM_LON).toFixed(5),
      walkability: r1(clamp(6 + 11 * central + jitter(i, 2, 2), 1, 20)),
      treeCanopy: r1(clamp(4 + 38 * adv + jitter(i, 3, 5), 0, 60)),
      parkMinutes: Math.round(clamp(22 - 16 * adv + jitter(i, 4, 4), 2, 30)),
      libraryMinutes: Math.round(clamp(30 - 18 * central + jitter(i, 5, 6), 4, 60)),
      groceryMinutes: Math.round(clamp(26 - 18 * adv - 4 * central + jitter(i, 6, 4), 3, 40)),
      transitStops: Math.round(clamp(4 + 20 * central + jitter(i, 7, 4), 0, 30)),
      heatDays: Math.round(clamp(46 - 30 * adv + jitter(i, 8, 5), 4, 60)),
      pm25: r1(clamp(14.5 - 6 * adv + jitter(i, 9, 1), 5, 20)),
      trafficProximity: Math.round(clamp(85 - 60 * adv + 10 * central + jitter(i, 10, 8), 0, 100)),
      broadband: Math.round(clamp(68 + 28 * adv + jitter(i, 11, 4), 50, 100)),
      pedestrianInjuries: Math.round(clamp(12 - 9 * adv + 4 * central + jitter(i, 12, 2), 0, 20)),
      communitySpaces: Math.round(clamp(3 + 8 * central + jitter(i, 13, 2), 0, 15)),
      source: 'synthetic, shaped like EPA Smart Location, CalEnviroScreen and ACS block-group data', year: '2025',
      adv,
    });
  }
  return out;
}

const SUBJECTS = ['gradeEla', 'gradeMath', 'gradeScience', 'gradeHistory', 'gradeArts', 'gradePE'];
const CLASSES = ['Art', 'Science', 'Math', 'English', 'P.E.', 'History', 'Robotics', 'Music', 'Ceramics', 'Spanish'];
const RATERS = ['teacher.0', 'teacher.1', 'teacher.2', 'teacher.3', 'teacher.4', 'teacher.5', 'counselor.6', 'counselor.7'];
const OBSERVED = ['curiosity', 'persistence', 'collaboration', 'leadership', 'selfAdvocacy', 'creativity', 'empathy', 'organization', 'resilience', 'publicSpeaking', 'listening', 'helpSeeking', 'independence', 'focus', 'handsOnSkill', 'joy'];

/**
 * students: the seed's student list ({ id, fn, g, sc, r }); schools: seed.schools;
 * schoolId(name) -> entity id.
 */
export async function seedDimensions({ store, sql, students, schools, schoolId }) {
  const blocks = placeBlocks();
  store.upsertFacts('place_blocks', blocks.map(({ adv, ...b }) => b), 'seed');
  // Schools sit in the middle of the map, one per quadrant.
  const at = new Map();
  schools.forEach((s, k) => {
    const pos = { lat: +(CENTER.lat + ((k % 2) - 0.5) * 3 * KM_LAT).toFixed(5), lon: +(CENTER.lon + (Math.floor(k / 2) - 0.5) * 4 * KM_LON).toFixed(5) };
    at.set(schoolId(s.name), pos);
    store.upsertEntity({ id: schoolId(s.name), ...pos }, 'seed');
  });
  const km = (a, b) => Math.hypot((a.lat - b.lat) / KM_LAT, (a.lon - b.lon) / KM_LON);

  const rows = [], speeches = [];
  const set = (entityId, key, v, src, extra = {}) => rows.push({ entityId, key, v, src, ...extra });
  students.forEach((s, i) => {
    const r = s.r, id = s.id, g = s.g;
    // Home: a block whose advantage is near the family's, with some noise.
    const target = clamp(r.ses + jitter(i, 20, 0.15), 0, 1);
    const block = blocks.slice().sort((a, b) => Math.abs(a.adv - target) - Math.abs(b.adv - target))[hash(i, 21) % 3];
    if (unit(i, 22) < 0.82) set(id, 'homeBlock', null, 'staff', { t: block.id });
    const kmGuess = Math.max(0.3, km(block, at.get(schoolId(s.sc))) + jitter(i, 23, 0.3));

    // Record extras: subject grades and history for everyone, tests from grade 3.
    for (const [n, k] of SUBJECTS.entries()) set(id, k, r1(clamp(r.gpa + jitter(i, 30 + n, 0.6) + (k === 'gradeArts' || k === 'gradePE' ? 0.3 : 0), 0, 4)), 'import');
    if (g >= 3) { set(id, 'stateEla', Math.round(clamp(r.testPercentile + jitter(i, 40, 15), 1, 99)), 'import'); set(id, 'stateMath', Math.round(clamp(r.testPercentile + jitter(i, 41, 15), 1, 99)), 'import'); }
    if (g >= 1 && g <= 8) set(id, 'readingLevelGap', r1(clamp((r.testPercentile - 50) / 20 + jitter(i, 42, 0.6), -3, 3)), 'import');
    set(id, 'yearsInDistrict', Math.max(0, Math.min(g + 1, Math.round((g + 1) * r.homeStability + jitter(i, 43, 1)))), 'import');
    set(id, 'schoolChanges', Math.round(clamp((1 - r.homeStability) * 5 + jitter(i, 44, 0.8), 0, 6)), 'import');
    if (g >= 9) set(id, 'creditsOnTrack', +clamp(r.gpa / 3.6 + jitter(i, 45, 0.12), 0.3, 1).toFixed(2), 'import');

    // Journey: reported by about half the families.
    if (unit(i, 50) < 0.55) {
      const mode = kmGuess < 1.5 ? 'walk' : g >= 9 && r.ses < 0.4 ? (unit(i, 51) < 0.6 ? 'transit' : 'bus') : unit(i, 51) < 0.35 ? 'bus' : unit(i, 51) < 0.85 ? 'car' : 'carpool';
      const speed = { walk: 4.5, bus: 18, transit: 16, car: 28, carpool: 26 }[mode];
      const minutes = Math.round(clamp((kmGuess * 1.3 / speed) * 60 + (mode === 'transit' ? 12 : mode === 'bus' ? 8 : 3) + jitter(i, 52, 6), 4, 85));
      set(id, 'commuteMode', null, 'family', { t: mode });
      set(id, 'commuteMinutes', minutes, 'family');
      set(id, 'transfers', mode === 'transit' ? 1 + (hash(i, 53) % 2) : 0, 'family');
      const leave = 7 * 60 + 40 - minutes - 5;
      set(id, 'leaveHomeAt', null, 'family', { t: `${Math.floor(leave / 60)}:${String(leave % 60).padStart(2, '0')}` });
      set(id, 'walkSafety', Math.round(clamp(1.5 + 3.5 * block.adv + jitter(i, 54, 0.8), 1, 5)), 'family');
      if (['bus', 'transit', 'carpool'].includes(mode)) { set(id, 'busReliability', Math.round(clamp(2 + 3 * unit(i, 55), 1, 5)), 'family'); set(id, 'lateRidesPerMonth', Math.round(clamp(4 * (1 - unit(i, 55)) + jitter(i, 56, 1), 0, 10)), 'family'); }
      set(id, 'dropsSiblings', unit(i, 57) < 0.18 ? 1 : 0, 'family');
    }

    // In their words: check-ins from grade 3 up, about two in three.
    if (g >= 3 && unit(i, 60) < 0.66) {
      const hidden = s.f?.hiddenRisk;
      set(id, 'belonging', Math.round(clamp(1 + 4 * r.peerConnected + jitter(i, 61, 0.7) - (hidden ? 1 : 0), 1, 5)), 'student');
      set(id, 'safeAtSchool', Math.round(clamp(2.5 + 2.5 * r.selScore + jitter(i, 62, 0.8), 1, 5)), 'student');
      set(id, 'trustedAdult', hidden || (r.peerConnected < 0.3 && unit(i, 63) < 0.6) ? 0 : unit(i, 63) < 0.88 ? 1 : 0, 'student');
      set(id, 'readyToLearn', Math.round(clamp(1 + 4 * (r.attendancePct / 100) * r.selScore + jitter(i, 64, 0.8) + 0.8, 1, 5)), 'student');
      set(id, 'stress', Math.round(clamp(4.5 - 3 * r.selScore + (g >= 9 ? 0.5 : 0) + jitter(i, 65, 0.8), 1, 5)), 'student');
      set(id, 'sleepHours', r1(clamp(9.5 - 0.25 * g + jitter(i, 66, 1.1) - (hidden ? 1 : 0), 4, 11)), 'student');
      if (g >= 6) set(id, 'futureClarity', Math.round(clamp(1.5 + 0.2 * (g - 6) + 2 * r.gpa / 4 + jitter(i, 67, 1), 1, 5)), 'student');
      if (g >= 10) set(id, 'workHours', r.ses < 0.4 && unit(i, 68) < 0.5 ? Math.round(8 + 16 * unit(i, 69)) : 0, 'student');
      if (g >= 6) set(id, 'caretakingHours', Math.round(unit(i, 70) < 0.25 ? 6 + 14 * unit(i, 71) : 2 * unit(i, 71)), 'student');
      set(id, 'favoriteClass', null, 'student', { t: CLASSES[hash(i, 72) % CLASSES.length] });
    }

    // Observed: about 45% have one or two adults' ratings.
    if (unit(i, 80) < 0.45) {
      const raters = unit(i, 81) < 0.4 ? 2 : 1;
      for (let k = 0; k < raters; k++) {
        const who = RATERS[(hash(i, 82) + k * 3) % RATERS.length];
        const base = { curiosity: r.testPercentile / 100, persistence: r.assignCompletionPct / 100, collaboration: r.peerConnected, leadership: r.extracurricularCount / 5, selfAdvocacy: r.selScore, creativity: unit(i, 83), empathy: r.selScore, organization: r.assignCompletionPct / 100, resilience: (r.selScore + (r.trajectory + 1) / 2) / 2, publicSpeaking: (r.selScore + unit(i, 84)) / 2, listening: r.selScore, helpSeeking: 1 - r.counselorVisits / 20, independence: r.gpa / 4, focus: r.attendancePct / 100 * 0.8, handsOnSkill: unit(i, 85), joy: (r.peerConnected + unit(i, 86)) / 2 };
        for (const [n, key] of OBSERVED.entries()) set(id, key, Math.round(clamp(2 + 8 * base[key] + jitter(i * 7 + k, 90 + n, 1.6), 1, 10)), 'staff', { rater: who, by: who });
      }
    }

    // Voice: Soapbox speeches from grade 6 up, about 40%; some give two.
    if (g >= 6 && unit(i, 100) < 0.4) {
      const n = unit(i, 101) < 0.18 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const sp = makeSpeech(i * 3 + k, { name: s.fn });
        speeches.push({ entityId: id, kind: 'speech', visibility: 'school', title: sp.title, text: sp.text, author: { id: id.toLowerCase(), role: 'student', name: s.fn }, source: 'seed · Project Soapbox (synthetic)' });
      }
    }
  });

  for (let i = 0; i < speeches.length; i += 60) await store.addFragments(speeches.slice(i, i + 60), 'seed');
  const written = store.setDimensions(rows, 'seed');
  const derived = await deriveAll({ store, sql, actor: 'seed' });
  return { blocks: blocks.length, speeches: speeches.length, written, derived };
}
