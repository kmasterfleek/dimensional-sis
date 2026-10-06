// Public demo mode: the sign-in page offers the demo accounts, and the actions
// a stranger could use to lock others out or erase records are turned off.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.LIBREA_DEMO = '1';
const { createApp } = await import('../src/server.js');

test('demo mode lists demo logins and blocks account and delete actions', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsis-demo-'));
  const app = await createApp({ dataDir, warm: false });
  const server = await app.router.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    app.auth.createUser({ username: 'admin', password: 'librea-admin', role: 'admin' });
    app.store.upsertEntity({ id: 'STU-1', type: 'student', grade: 5 });
    const status = await (await fetch(base + '/api/auth/status')).json();
    assert.deepEqual(status.demo.logins.map((l) => l.username), ['admin'], 'only accounts that exist are offered');
    const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'librea-admin' }) });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const call = (method, url, body) => fetch(base + url, { method, headers: { cookie, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    assert.equal((await call('POST', '/api/users', { username: 'x', password: 'xxxxxxxx', role: 'admin' })).status, 403);
    assert.equal((await call('PUT', '/api/users/admin', { password: 'changed-it' })).status, 403);
    assert.equal((await call('DELETE', '/api/people/STU-1')).status, 403);
    assert.equal((await call('GET', '/api/people/STU-1')).status, 200, 'reading still works');
    assert.ok(app.store.getEntity('STU-1'));
  } finally { app.close(); server.close(); }
});
