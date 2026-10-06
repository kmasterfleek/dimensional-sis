// Dimensional SIS server. One process, one folder, no cloud.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from './api/router.js';
import { attachUser } from './api/context.js';
import { registerCore } from './api/routes-core.js';
import { registerExport } from './api/routes-export.js';
import { registerCurriculum } from './api/routes-curriculum.js';
import { registerSql } from './api/routes-sql.js';
import { registerOnboard } from './api/routes-onboard.js';
import { loadEdition } from './core/edition.js';
import { SqlProjection } from './sql/projection.js';
import { Store } from './core/store.js';
import { Auth } from './core/auth.js';
import { getEmbedder } from './core/embed.js';
import { HttpError } from './api/router.js';

/**
 * A public demo publishes its passwords, so it turns off what a stranger could
 * use to lock others out, erase records or post images: accounts, invites,
 * deletes, imports, photo uploads and place-data replacement.
 */
export const DEMO = process.env.LIBREA_DEMO === '1';
const DEMO_BLOCKED = [
  ['POST', '/api/users'], ['PUT', '/api/users/:username'], ['POST', '/api/auth/bootstrap'],
  ['POST', '/api/invites'], ['POST', '/api/invites/:code/revoke'], ['POST', '/api/invites/redeem'],
  ['DELETE', '/api/people/:id'], ['DELETE', '/api/apps/:slug'], ['DELETE', '/api/dimensions/concepts/:key'],
  ['POST', '/api/import/apply'], ['POST', '/api/facts/:table/delete'], ['POST', '/api/dimensions/places'],
  ['POST', '/api/people/:id/photo'], ['POST', '/api/sql/rebuild'],
];
const demoBlocked = (method, pattern) => DEMO && DEMO_BLOCKED.some(([m, p]) => m === method && p === pattern);

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');

export async function createApp({ dataDir = process.env.LIBREA_DATA || path.join(ROOT, 'data'), warm = true } = {}) {
  const sql = new SqlProjection(dataDir).open();
  const store = await new Store(dataDir).attach(sql).open();
  const auth = new Auth(dataDir);
  const router = new Router();
  const withUser = attachUser(auth, store, sql);

  // Every route sees ctx.user / ctx.scope before it runs.
  const origHandle = router.handle.bind(router);
  router.handle = (req, res) => origHandle(req, res);
  const origAdd = router.add.bind(router);
  router.add = (method, pattern, handler) => origAdd(method, pattern, (ctx) => {
    if (demoBlocked(method, pattern)) throw new HttpError(403, 'Turned off in the public demo.');
    withUser(ctx); return handler(ctx);
  });

  registerCore(router, { store, auth, dataDir });
  registerExport(router, { store });
  registerCurriculum(router, { root: ROOT });
  registerSql(router, { store, sql });
  registerOnboard(router, { store, auth });
  for (const mod of await optionalModules()) mod.register?.(router, { store, auth, dataDir, root: ROOT, sql, edition: loadEdition() });
  router.static('/', path.join(ROOT, 'public'));

  if (warm) getEmbedder().catch((e) => console.error('embedder init failed:', e.message));
  const snapshotTimer = setInterval(() => store.snapshot(), 60_000);
  snapshotTimer.unref();
  return { router, store, auth, sql, dataDir, close: () => { clearInterval(snapshotTimer); store.snapshot(); sql.close(); } };
}

/** Feature modules register themselves if present (import, vibe). */
async function optionalModules() {
  const mods = [];
  for (const spec of ['./import/routes.js', './vibe/routes.js', './compliance/routes.js', './dimensions/routes.js']) {
    try { mods.push(await import(spec)); } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
  }
  return mods;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 4321;
  const host = process.env.HOST || '127.0.0.1';
  const app = await createApp();
  const server = await app.router.listen(port, host);
  console.log(`${loadEdition().name} (${loadEdition().id} edition) listening on http://${host}:${port}  data: ${app.dataDir}`);
  const stop = () => { app.close(); server.close(() => process.exit(0)); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
