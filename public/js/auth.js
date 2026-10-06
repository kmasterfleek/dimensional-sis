// Sign in, and first-run bootstrap of the district admin.
import { api, h, render, status, refreshUser, state } from '/app.js';

export async function show() {
  let bootstrapped = true, demo = null;
  try { ({ bootstrapped, demo } = await api('/api/auth/status')); } catch { /* server not ready */ }
  render(bootstrapped ? signInCard(demo) : bootstrapCard());
  document.querySelector('#view input')?.focus();
}

function shell(title, lede, ...kids) {
  return h('div.centered',
    h('div.row', { style: 'gap:10px;margin-bottom:18px' }, h('span.mark', { style: 'width:22px;height:22px' }), h('span', { style: 'font-size:1.3rem;font-weight:650' }, 'Dimensional SIS')),
    h('div.card', h('h1', title), h('p.lede', lede), ...kids),
    h('p.small.muted', { style: 'margin-top:14px' }, 'This is running on your machine. Your records never leave the building unless you choose to send them.'),
  );
}

function signInCard(demo) {
  const err = h('p.err', { role: 'alert' });
  const form = h('form', { onsubmit: onSubmit },
    field('Username', h('input', { type: 'text', id: 'u', name: 'username', autocomplete: 'username', required: true })),
    field('Password', h('input', { type: 'password', id: 'p', name: 'password', autocomplete: 'current-password', required: true })),
    err,
    h('button.btn', { type: 'submit' }, 'Sign in'),
  );
  async function onSubmit(e) {
    e.preventDefault();
    err.textContent = '';
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      await api('/api/auth/login', { method: 'POST', body: { username: form.username.value, password: form.password.value } });
      await refreshUser();
      status(`Signed in as ${state.user?.username}.`);
      window.location.hash = '#/';
      const { boot } = await import('/app.js');
      await boot();
    } catch (ex) {
      err.textContent = ex.status === 401 ? 'That username and password do not match.' : ex.message;
      btn.disabled = false;
    }
  }
  if (demo?.logins?.length) return demoShell(demo, form);
  return shell('Sign in', 'Students, families, teachers and administrators each see a different slice of the same record.', form);
}

/** The public demo: a tour button and one-click sign-in for each role. */
function demoShell(demo, form) {
  const err = h('p.err', { role: 'alert' });
  async function enter(l, tour) {
    err.textContent = '';
    try {
      await api('/api/auth/login', { method: 'POST', body: { username: l.username, password: l.password } });
      await refreshUser();
      window.location.hash = '#/' + (l.role === 'student' ? 'me' : l.role === 'family' ? 'mine' : '');
      const { boot } = await import('/app.js');
      await boot();
      if (tour) (await import('/js/tour.js')).start();
    } catch (ex) { err.textContent = ex.message; }
  }
  const admin = demo.logins.find((l) => l.role === 'admin');
  return h('div.centered',
    h('div.row', { style: 'gap:10px;margin-bottom:18px' }, h('span.mark', { style: 'width:22px;height:22px' }), h('span', { style: 'font-size:1.3rem;font-weight:650' }, 'Dimensional SIS')),
    h('div.card',
      h('h1', 'See every dimension of a student'),
      h('p.lede', 'A free, open-source student information system. This public demo is a made-up district of 850 synthetic students; no real child is here.'),
      admin ? h('button.btn', { style: 'width:100%;margin:6px 0 14px', onclick: () => enter(admin, true) }, 'Take the five-minute guided tour') : null,
      h('p.small.muted', { style: 'margin:0 0 8px' }, 'Or look around as:'),
      h('div.row', { style: 'gap:8px' }, demo.logins.map((l) => h('button.btn.ghost', { onclick: () => enter(l, false) }, l.label))),
      err,
      h('details', { style: 'margin-top:16px' }, h('summary.small', 'Sign in with a username'), h('div', { style: 'margin-top:10px' }, form))),
    h('p.small.muted', { style: 'margin-top:14px' }, 'In a real installation this runs on the school’s own machine, and records never leave the building. Some actions (accounts, deletes, imports, photos) are turned off in this public demo. Source: github.com/kmasterfleek/dimensional-sis'),
  );
}

function bootstrapCard() {
  const err = h('p.err', { role: 'alert' });
  const form = h('form', { onsubmit: onSubmit },
    field('Admin username', h('input', { type: 'text', id: 'u', name: 'username', autocomplete: 'username', required: true, placeholder: 'e.g. admin' })),
    field('Password', h('input', { type: 'password', id: 'p', name: 'password', autocomplete: 'new-password', required: true, minLength: 8 }), 'At least 8 characters. Stored as a scrypt hash in your data folder.'),
    err,
    h('button.btn', { type: 'submit' }, 'Create the district admin'),
  );
  async function onSubmit(e) {
    e.preventDefault();
    err.textContent = '';
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      await api('/api/auth/bootstrap', { method: 'POST', body: { username: form.username.value, password: form.password.value } });
      await api('/api/auth/login', { method: 'POST', body: { username: form.username.value, password: form.password.value } });
      await refreshUser();
      status('District admin created. Welcome to Dimensional SIS.');
      window.location.hash = '#/';
      const { boot } = await import('/app.js');
      await boot();
    } catch (ex) { err.textContent = ex.message; btn.disabled = false; }
  }
  return shell('Create the district admin', 'Nobody has an account yet. The first account owns this installation — everyone else is invited from inside.', form);
}

function field(label, input, hint) {
  return h('div.field', h('label', { for: input.id }, label), input, hint ? h('p.small.muted', { style: 'margin:4px 0 0' }, hint) : null);
}
