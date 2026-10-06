// The dimension registry: every way the system can see a student, as data.
// The 15 core signals stay where they were (src/core/schema.js, computed from
// metrics); this file adds the families around them. Every dimension is
// optional. A missing value is unknown, never zero, and the gaps are a to-do
// list rather than a hole (see profile.js `unlocks`).
//
// Def fields:
//   key, label, family, group, desc
//   kind     core | number | rating | bool | category | text | concept
//   min/max  range for numbers and ratings; unit for display
//   better   'high' | 'low' | null  (null = context: no favorable direction)
//   fill     the action that fills it in (see FILLS)
//   writers  roles that may set it by hand ([] = derived only)
//   visibility  'school' (student, family and staff) or 'staff'
import { DIMENSIONS } from '../core/schema.js';

export const FAMILIES = [
  { id: 'record', label: 'Record', desc: 'What the school already keeps: grades, attendance, tests, services.' },
  { id: 'self', label: 'In their words', desc: 'What the student tells us in a short check-in.' },
  { id: 'journey', label: 'Journey', desc: 'How they get to school, and what that costs them each day.' },
  { id: 'voice', label: 'Voice', desc: 'Speeches and writing, read by meaning: what they care about and how they argue.' },
  { id: 'observed', label: 'Observed', desc: 'What adults who know them see, rated 1 to 10.' },
  { id: 'place', label: 'Place', desc: 'The neighborhood around home, from public data. Context only: it describes the place, never the child.' },
];
export const FAMILY_IDS = FAMILIES.map((f) => f.id);

/** The actions that fill dimensions in, and who can take them. */
export const FILLS = {
  import: { label: 'Import the rest of the record from the current SIS', who: ['admin'] },
  derive: { label: 'Recompute from attendance and incident rows', who: ['admin'] },
  checkin: { label: 'A five-minute student check-in', who: ['student', 'staff', 'admin'] },
  journey: { label: 'Ask the family how they get to school', who: ['family', 'staff', 'admin'] },
  observe: { label: 'A teacher who knows them fills in observations', who: ['staff', 'admin'] },
  speech: { label: 'A Soapbox speech or a piece of their writing', who: ['student', 'staff', 'admin'] },
  place: { label: 'Link the home neighborhood to public data', who: ['staff', 'admin'] },
};

const STAFF = ['staff', 'admin'];
const defs = [];
const add = (family, group, fill, writers, list) => {
  for (const [key, label, kind, opts = {}] of list) defs.push({ key, label, family, group, kind, fill, writers, visibility: 'school', better: null, ...opts });
};

// ---- Record: the 15 core signals (values come from entity.dims) ----
for (const d of DIMENSIONS) defs.push({ key: d.key, label: d.label, family: 'record', group: d.domain, kind: 'core', min: 0, max: 1, better: 'high', fill: 'import', writers: [], visibility: 'school', desc: d.desc });

add('record', 'Attendance detail', 'derive', [], [
  ['tardyRate', 'Late arrivals', 'number', { min: 0, max: 0.3, unit: 'share of days', better: 'low', desc: 'Share of school days marked tardy.' }],
  ['mondayAbsenceShare', 'Monday absences', 'number', { min: 0, max: 1, unit: 'share of absences', desc: 'Share of absences that fall on a Monday (needs at least two absences).' }],
  ['longestAbsenceStreak', 'Longest absence streak', 'number', { min: 0, max: 10, unit: 'days', better: 'low', desc: 'Most consecutive school days absent.' }],
  ['recentAttendance', 'Attendance, last 10 days', 'number', { min: 0, max: 1, unit: 'share', better: 'high', desc: 'Present or tardy on the ten most recent school days.' }],
  ['incidentVariety', 'Kinds of incidents', 'number', { min: 0, max: 5, unit: 'types', better: 'low', desc: 'How many different kinds of discipline incident are on file.' }],
]);
add('record', 'Subjects', 'import', STAFF, [
  ['gradeEla', 'English grade', 'number', { min: 0, max: 4, unit: 'GPA points', better: 'high' }],
  ['gradeMath', 'Math grade', 'number', { min: 0, max: 4, unit: 'GPA points', better: 'high' }],
  ['gradeScience', 'Science grade', 'number', { min: 0, max: 4, unit: 'GPA points', better: 'high' }],
  ['gradeHistory', 'History grade', 'number', { min: 0, max: 4, unit: 'GPA points', better: 'high' }],
  ['gradeArts', 'Arts grade', 'number', { min: 0, max: 4, unit: 'GPA points', better: 'high' }],
  ['gradePE', 'PE grade', 'number', { min: 0, max: 4, unit: 'GPA points', better: 'high' }],
]);
add('record', 'Assessments and history', 'import', STAFF, [
  ['stateEla', 'State test, English', 'number', { min: 0, max: 100, unit: 'percentile', better: 'high' }],
  ['stateMath', 'State test, math', 'number', { min: 0, max: 100, unit: 'percentile', better: 'high' }],
  ['readingLevelGap', 'Reading level vs grade', 'number', { min: -3, max: 3, unit: 'grade levels', better: 'high', desc: 'Positive means reading above grade level.' }],
  ['yearsInDistrict', 'Years in the district', 'number', { min: 0, max: 13, unit: 'years' }],
  ['schoolChanges', 'School changes', 'number', { min: 0, max: 6, unit: 'moves', better: 'low', desc: 'Times they changed schools mid-way.' }],
  ['creditsOnTrack', 'Credits on track', 'number', { min: 0, max: 1, unit: 'share of pace', better: 'high', desc: 'Credits earned against the pace to graduate (high school).' }],
]);

// ---- In their words: the student check-in ----
add('self', 'Check-in', 'checkin', ['student', ...STAFF], [
  ['belonging', 'I belong at this school', 'rating', { min: 1, max: 5, unit: '1–5', better: 'high' }],
  ['safeAtSchool', 'I feel safe at school', 'rating', { min: 1, max: 5, unit: '1–5', better: 'high' }],
  ['trustedAdult', 'There is an adult here I trust', 'bool', { better: 'high' }],
  ['readyToLearn', 'I come to school ready to learn', 'rating', { min: 1, max: 5, unit: '1–5', better: 'high' }],
  ['stress', 'How stressed I feel', 'rating', { min: 1, max: 5, unit: '1–5', better: 'low' }],
  ['sleepHours', 'Hours of sleep on a school night', 'number', { min: 3, max: 11, unit: 'hours', better: 'high' }],
  ['futureClarity', 'I know what I want to do next', 'rating', { min: 1, max: 5, unit: '1–5', better: 'high' }],
  ['workHours', 'Hours a week at a job', 'number', { min: 0, max: 40, unit: 'hours' }],
  ['caretakingHours', 'Hours a week caring for family', 'number', { min: 0, max: 40, unit: 'hours' }],
  ['favoriteClass', 'Favorite class', 'text'],
]);

// ---- Journey: getting to school ----
export const COMMUTE_MODES = { walk: 4.5, bike: 13, bus: 18, transit: 16, car: 28, carpool: 26 };
add('journey', 'Getting there', 'journey', ['family', ...STAFF], [
  ['commuteMinutes', 'Minutes to school', 'number', { min: 0, max: 90, unit: 'minutes', better: 'low' }],
  ['commuteMode', 'How they get there', 'category', { levels: Object.keys(COMMUTE_MODES) }],
  ['transfers', 'Transfers on the way', 'number', { min: 0, max: 4, unit: 'changes', better: 'low' }],
  ['leaveHomeAt', 'Leaves home at', 'text', { unit: 'time' }],
  ['walkSafety', 'The walk feels safe', 'rating', { min: 1, max: 5, unit: '1–5', better: 'high' }],
  ['busReliability', 'The bus or ride is reliable', 'rating', { min: 1, max: 5, unit: '1–5', better: 'high' }],
  ['lateRidesPerMonth', 'Late rides a month', 'number', { min: 0, max: 10, unit: 'days', better: 'low' }],
  ['dropsSiblings', 'Drops siblings off first', 'bool'],
]);
add('journey', 'Getting there', 'place', [], [
  ['distanceKm', 'Distance to school', 'number', { min: 0, max: 20, unit: 'km', desc: 'From the home neighborhood centre to the school, straight line.' }],
]);

// ---- Voice: speeches and writing ----
add('voice', 'Volume', 'speech', [], [
  ['speechesGiven', 'Speeches on record', 'number', { min: 0, max: 5, unit: 'speeches', better: 'high' }],
  ['writtenPieces', 'Pieces in their own words', 'number', { min: 0, max: 10, unit: 'pieces', better: 'high', desc: 'Self-written fragments, speeches and work samples.' }],
  ['voiceTopics', 'Topics they speak to', 'number', { min: 0, max: 8, unit: 'topics', better: 'high', desc: 'How many concept dimensions their own words clearly reach.' }],
]);

/**
 * Concept dimensions: defined by one sentence and scored by meaning against
 * the student's own shared words. Anyone on staff can add more at runtime.
 */
export const STARTER_CONCEPTS = [
  ['climate', 'Climate and environment', 'Issues', 'The environment and climate change: extreme heat, hot classrooms, no shade trees, pollution, and protecting nature.'],
  ['safety', 'School safety', 'Issues', 'Feeling safe at school, school shootings, violence, and lockdown drills.'],
  ['mentalHealth', 'Mental health', 'Issues', 'Stress, anxiety, depression, and getting mental health support for young people.'],
  ['housing', 'Housing and rent', 'Issues', 'Rent going up, families being pushed out, homelessness, and crowded housing.'],
  ['immigration', 'Immigration and family', 'Issues', 'Immigrant families, papers, deportation, and families being separated.'],
  ['equity', 'Fairness and equity', 'Issues', 'Racism, unfair treatment, and making sure every group gets a fair chance.'],
  ['publicHealth', 'Health and vaping', 'Issues', 'Vaping, drugs, food, period products, and the health of teenagers.'],
  ['streets', 'Streets and getting around', 'Issues', 'Dangerous crosswalks, traffic, buses, bike lanes, and getting around the neighborhood safely.'],
  ['personalStory', 'Argues from personal story', 'How they argue', 'I am going to tell you what happened to me and my family, because I lived it.'],
  ['evidence', 'Argues from evidence', 'How they argue', 'According to the data, the statistics and research show a clear percentage and number.'],
  ['callToAction', 'Calls people to act', 'How they argue', 'I am asking you to act now: sign, vote, show up, and change this together.'],
  ['community', 'Speaks for community', 'How they argue', 'This is about my whole community, my neighbors, and the younger kids coming after us.'],
  ['handsOn', 'Building and fixing', 'Interests', 'Building, fixing, and making things with my hands and tools.'],
  ['creative', 'Art and expression', 'Interests', 'Drawing, music, writing, dance, and creative expression.'],
  ['caretaking', 'Caring for family', 'Interests', 'Taking care of my younger brothers and sisters and helping my family at home.'],
  ['movement', 'Sports and movement', 'Interests', 'Sports, running, playing on a team, and moving my body.'],
];
export const conceptDef = ({ key, label, group, sentence, by = 'system', custom = false }) => ({
  key, label, family: 'voice', group: group || 'Your dimensions', kind: 'concept', min: 0, max: 1, better: null,
  fill: 'speech', writers: [], visibility: 'school', sentence, by, custom,
  desc: `Scored by meaning against: “${sentence}”`,
});
for (const [k, label, group, sentence] of STARTER_CONCEPTS) defs.push(conceptDef({ key: 'c.' + k, label, group, sentence }));

// ---- Observed: adults who know them, 1-10, averaged across raters ----
add('observed', 'Observed', 'observe', STAFF, [
  ['curiosity', 'Curiosity'], ['persistence', 'Persistence'], ['collaboration', 'Collaboration'], ['leadership', 'Leadership'],
  ['selfAdvocacy', 'Speaks up for themselves'], ['creativity', 'Creativity'], ['empathy', 'Empathy'], ['organization', 'Organization'],
  ['resilience', 'Bounces back'], ['publicSpeaking', 'Public speaking'], ['listening', 'Listening'], ['helpSeeking', 'Asks for help'],
  ['independence', 'Works independently'], ['focus', 'Focus'], ['handsOnSkill', 'Skill with hands and tools'], ['joy', 'Brings joy to the room'],
].map(([k, l]) => [k, l, 'rating', { min: 1, max: 10, unit: '1–10', better: 'high' }]));

// ---- Place: public neighborhood data, context only ----
add('place', 'Neighborhood', 'place', STAFF, [['homeBlock', 'Home neighborhood (block group)', 'text', { desc: 'The census block group of home. Links the place dimensions below; never a street address.' }]]);
export const PLACE_COLUMNS = {
  walkability: ['Walkability', 1, 20, 'index'],
  treeCanopy: ['Tree canopy', 0, 60, '% of land'],
  parkMinutes: ['Walk to a park', 0, 30, 'minutes'],
  libraryMinutes: ['Trip to a library', 0, 60, 'minutes'],
  groceryMinutes: ['Walk to a grocery store', 0, 40, 'minutes'],
  transitStops: ['Transit stops nearby', 0, 30, 'stops'],
  heatDays: ['Days over 95°F', 0, 60, 'days a year'],
  pm25: ['Fine-particle air pollution', 5, 20, 'µg/m³'],
  trafficProximity: ['Traffic exposure', 0, 100, 'percentile'],
  broadband: ['Homes with broadband', 50, 100, '%'],
  pedestrianInjuries: ['Pedestrian injuries nearby', 0, 20, 'a year'],
  communitySpaces: ['Community spaces nearby', 0, 15, 'places'],
};
add('place', 'Neighborhood', 'place', [], Object.entries(PLACE_COLUMNS).map(([k, [label, min, max, unit]]) => [k, label, 'number', { min, max, unit }]));

for (const d of defs) d.context = d.family === 'place';
export const BUILTIN = defs;
const byKey = new Map(defs.map((d) => [d.key, d]));
if (byKey.size !== defs.length) throw new Error('duplicate dimension key in registry');

/** Built-in defs plus custom concept defs (a Map of key -> def from the store). */
export function allDefs(custom = new Map()) { return [...defs, ...custom.values()]; }
export function getDef(key, custom = new Map()) { return byKey.get(key) || custom.get(key) || null; }

/** 0..1 for charts and similarity. Favorable end is 1 when `better` is set; context dims keep their natural direction. */
export function normalize(def, v) {
  if (v == null || !def) return null;
  if (def.kind === 'bool') return v ? 1 : 0;
  if (!['core', 'number', 'rating', 'concept'].includes(def.kind)) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const span = (def.max ?? 1) - (def.min ?? 0) || 1;
  const x = Math.min(1, Math.max(0, (n - (def.min ?? 0)) / span));
  return def.better === 'low' ? 1 - x : x;
}

/** Validate a hand-entered value against its def. Returns { v, t } or throws. */
export function coerce(def, raw) {
  if (raw === null || raw === '') return { v: null, t: null };
  switch (def.kind) {
    case 'number': case 'rating': {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error(`${def.label}: not a number`);
      if (n < def.min || n > def.max) throw new Error(`${def.label}: must be between ${def.min} and ${def.max}`);
      return { v: def.kind === 'rating' ? Math.round(n) : n, t: null };
    }
    case 'bool': {
      if (raw === true || raw === 'true' || raw === 'yes' || raw === 1) return { v: 1, t: null };
      if (raw === false || raw === 'false' || raw === 'no' || raw === 0) return { v: 0, t: null };
      throw new Error(`${def.label}: yes or no`);
    }
    case 'category': {
      const s = String(raw).toLowerCase();
      if (!def.levels.includes(s)) throw new Error(`${def.label}: one of ${def.levels.join(', ')}`);
      return { v: null, t: s };
    }
    case 'text': return { v: null, t: String(raw).trim().slice(0, 120) };
    default: throw new Error(`${def.label} is computed, not entered by hand`);
  }
}

/** Slug for a new concept dimension. */
export function conceptKey(label) {
  const s = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 4)
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('');
  if (!s) throw new Error('label required');
  return 'c.' + s.slice(0, 40);
}
