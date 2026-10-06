// The guided tour for the public demo. A small panel walks a visitor through
// the real pages: it moves to each one, points at the thing it describes, and
// opens the right tab. Progress is kept in this browser only.
import { api, h, go, state, refreshUser } from '/app.js';

const KEY = 'dsis-tour';
const JAMES = 'person/STU-0764';
const read = () => { try { const v = localStorage.getItem(KEY); return v == null ? null : Number(v); } catch { return null; } };
const write = (v) => { try { v == null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, String(v)); } catch { /* private mode */ } };

const byText = (sel, text) => () => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(text));
const tab = (name) => () => { const b = byText('.tabs button', name)(); b?.click(); return !!b; };

const STEPS = [
  { route: 'home', title: 'Welcome to Dimensional SIS',
    body: 'This is a made-up district: 850 synthetic students in four schools. No real child is here. The tour takes about five minutes, and you can click around at any point and come back with Next.' },
  { route: JAMES, find: () => document.querySelector('.question') || document.querySelector('#view h1'), title: 'Meet James',
    body: 'An eleventh grader. At the top is what most systems know: grades, attendance, a few codes. His attendance is 80%, which usually earns a label like “chronically absent.” Here it shows up as a question for an adult instead.' },
  { route: JAMES, find: () => document.querySelector('.fp'), title: 'Every dimension',
    body: 'Each square is one way of seeing him, about a hundred in six groups: the record, his own words, his journey to school, his voice, what adults observe, and his neighborhood. Grey means unknown, never zero.' },
  { route: JAMES, find: () => document.querySelector('.unlock'), title: 'Gaps become a to-do list',
    body: 'Nothing is complete, and the system says so. It lists what would fill in the rest and who can do it: the student, the family, a teacher.' },
  { route: JAMES, act: tab('Journey'), find: byText('.tabs button', 'Journey'), title: 'How he gets to school',
    body: 'His family told us: he leaves at 7:01, takes transit with two transfers, and the walk does not feel safe. That changes the question from “why is he absent?” to “what would make his mornings possible?”' },
  { route: JAMES, act: tab('Voice'), find: () => document.querySelector('.dimev'), title: 'His voice, read by meaning',
    body: 'He gave a Project Soapbox speech about crossing six lanes of traffic. It is read by meaning on this server, never sent to an AI company. “Streets and getting around” scores 100, and the passage that earned it is shown right there.' },
  { route: JAMES, act: tab('Place'), find: byText('.tabs button', 'Place'), title: 'The neighborhood, as context',
    body: 'Public neighborhood data (walkability, heat, parks) describes the place, never the child. It never raises a question about him and is left out of every comparison.' },
  { route: 'dimensions', find: () => document.querySelector('#cd-sentence'), act: () => fill({ '#cd-label': 'Bullying and being targeted', '#cd-sentence': 'Being bullied, harassed online, or made to feel like you do not belong.' }), title: 'Invent a new dimension',
    body: 'Anyone on staff can add a dimension by writing one sentence. We filled one in for you. Press “Preview who it finds” to see whose own words reach it, with the passage that shows why.' },
  { route: 'people', find: () => document.querySelector('#sem-q'), act: () => fill({ '#sem-q': 'walking to school is dangerous' }), title: 'Search by meaning',
    body: 'Ask in plain language and search what students, families and teachers actually wrote, even when they used different words. Press Search.' },
  { route: 'build', find: () => document.querySelector('#prompt'), act: () => fill({ '#prompt': 'A page for counselors listing students with long commutes and late arrivals this month' }), title: 'Build a tool in a sentence',
    body: 'Staff describe the dashboard or page they need and get a working one with its own address. In this public demo, tools are built offline from templates, so nothing leaves the server.' },
  { route: 'home', find: byText('#view h2', 'Sovereignty'), title: 'It stays in the building',
    body: 'Every change is written to a tamper-evident log, everything can be exported as plain files, and student records never go to a model provider. The data lives on the school’s own machine.' },
  { route: 'home', title: 'Now see it from the other side', end: true,
    body: 'Students and families see their own record, add to it, and can flag anything that looks wrong. Switch views below, or keep exploring as the administrator.' },
];

/** Fill empty fields; true once every field exists. */
function fill(map) {
  const els = Object.keys(map).map((sel) => document.querySelector(sel));
  if (els.some((el) => !el)) return false;
  Object.values(map).forEach((v, i) => { if (!els[i].value) { els[i].value = v; els[i].dispatchEvent(new Event('input', { bubbles: true })); } });
  return true;
}

let panel = null;

export function start() { write(0); show(0, true); }
export function resume() { const i = read(); if (i != null && state.user) show(i, false); }
function stop() { write(null); panel?.remove(); panel = null; document.querySelectorAll('.tour-glow').forEach((e) => e.classList.remove('tour-glow')); }

async function switchTo(username, password) {
  stop();
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* already out */ }
  await api('/api/auth/login', { method: 'POST', body: { username, password } });
  await refreshUser();
  window.location.hash = '#/' + (state.user?.role === 'student' ? 'me' : state.user?.role === 'family' ? 'mine' : '');
  (await import('/app.js')).boot();
}

function show(i, navigate) {
  const step = STEPS[Math.max(0, Math.min(STEPS.length - 1, i))];
  write(i);
  panel?.remove();
  const logins = state.demo?.logins || [];
  const as = (role) => logins.find((l) => l.role === role);
  panel = h('aside.tour', { role: 'dialog', 'aria-label': 'Guided tour' },
    h('div.spread', h('span.small.muted', `Tour · ${i + 1} of ${STEPS.length}`), h('button.linkish', { onclick: stop, 'aria-label': 'End the tour' }, 'End tour')),
    h('h3', step.title),
    h('p', step.body),
    step.end ? h('div.row', { style: 'gap:8px;margin-bottom:10px' },
      as('family') ? h('button.btn.ghost', { onclick: () => switchTo(as('family').username, as('family').password) }, 'See the family view') : null,
      as('student') ? h('button.btn.ghost', { onclick: () => switchTo(as('student').username, as('student').password) }, 'See the student view') : null) : null,
    h('div.row', { style: 'gap:8px' },
      i > 0 ? h('button.btn.ghost', { onclick: () => show(i - 1, true) }, 'Back') : null,
      step.end ? h('button.btn', { onclick: stop }, 'Finish') : h('button.btn', { onclick: () => show(i + 1, true) }, 'Next')),
  );
  document.body.appendChild(panel);
  const here = window.location.hash.replace(/^#\/?/, '') || 'home';
  if (navigate && here !== step.route) { pending = step; go('/' + step.route); } else point(step);
}

let pending = null;
window.addEventListener('dsis:rendered', () => { if (pending) { const s = pending; pending = null; point(s); } });

/** Wait for the thing to exist (some sections load after the page), then act on it and point at it. */
async function point(step) {
  document.querySelectorAll('.tour-glow').forEach((e) => e.classList.remove('tour-glow'));
  if (!step.find && !step.act) return;
  // Sections load after the page does: keep trying the action, then wait for the target.
  let acted = !step.act, el = null;
  for (let t = 0; t < 40; t++) {
    if (!acted) acted = !!step.act();
    el = acted ? step.find?.() : null;
    if (el || (acted && !step.find)) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('tour-glow');
}
