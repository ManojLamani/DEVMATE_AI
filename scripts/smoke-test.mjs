#!/usr/bin/env node
// End-to-end smoke test for a running DevMate AI stack (docker compose up).
// Usage: node scripts/smoke-test.mjs [owner/repo]
// Ports are read from the environment or the root .env (FRONTEND_PORT, BACKEND_PORT, ML_PORT).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dotenv = {};
try {
  const file = fileURLToPath(new URL('../.env', import.meta.url));
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) dotenv[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env — use defaults */ }
const env = (key, fallback) => process.env[key] || dotenv[key] || fallback;

const BACKEND = `http://localhost:${env('BACKEND_PORT', '5000')}`;
const API = `${BACKEND}/api`;
const ML = `http://localhost:${env('ML_PORT', '8000')}`;
const WEB = `http://localhost:${env('FRONTEND_PORT', '3000')}`;
const REPO = process.argv[2] || 'expressjs/cors';

const results = [];
const email = `smoke-${Date.now()}@example.com`;
const password = 'Passw0rd!123';
let token, repoId, issueId;

async function call(method, url, body, auth = true) {
  const headers = { 'Content-Type': 'application/json', Origin: WEB };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, headers: res.headers };
}

async function check(name, fn) {
  try {
    results.push(['PASS', name, (await fn()) ?? '']);
  } catch (e) {
    results.push(['FAIL', name, e.message]);
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const short = (o) => JSON.stringify(o).slice(0, 160);
const ok = (r) => expect(r.status === 200, `${r.status} ${short(r.json)}`);

// ── Infrastructure ──
await check('backend /health', async () => { const r = await fetch(`${BACKEND}/health`); expect(r.ok, r.status); });
await check('ml /health', async () => {
  const r = await (await fetch(`${ML}/health`)).json();
  expect(r.models?.length === 6, short(r));
  return `${r.models.length} models`;
});
await check('frontend index', async () => {
  const r = await fetch(WEB);
  expect(r.ok && (await r.text()).includes('id="root"'), r.status);
});
await check('frontend SPA fallback /login', async () => {
  const r = await fetch(`${WEB}/login`);
  expect(r.ok && (await r.text()).includes('id="root"'), r.status);
});
await check('frontend bundle points at API', async () => {
  const html = await (await fetch(WEB)).text();
  const src = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  expect(src, 'no bundle script tag');
  const js = await (await fetch(WEB + src)).text();
  expect(js.includes(API), `bundle does not reference ${API}`);
});

// ── Auth ──
await check('register', async () => {
  const r = await call('POST', `${API}/auth/register`, { name: 'Smoke Test', email, password }, false);
  expect(r.status === 201 && r.json.data?.token, `${r.status} ${short(r.json)}`);
  expect(r.headers.get('access-control-allow-origin') === WEB, 'CORS origin mismatch — check FRONTEND_URL');
  expect(!('password' in r.json.data.user), 'response leaks password');
});
await check('register duplicate -> 409', async () => {
  const r = await call('POST', `${API}/auth/register`, { name: 'Smoke Test', email, password }, false);
  expect(r.status === 409, r.status);
});
await check('register invalid -> 400', async () => {
  const r = await call('POST', `${API}/auth/register`, { name: 'x', email: 'bad', password: '1' }, false);
  expect(r.status === 400, `${r.status} ${short(r.json)}`);
});
await check('login wrong password -> 401', async () => {
  const r = await call('POST', `${API}/auth/login`, { email, password: 'wrong' }, false);
  expect(r.status === 401, r.status);
});
await check('login', async () => {
  const r = await call('POST', `${API}/auth/login`, { email, password }, false);
  expect(r.status === 200 && r.json.data?.token, `${r.status} ${short(r.json)}`);
  token = r.json.data.token;
});
await check('me', async () => {
  const r = await call('GET', `${API}/auth/me`);
  expect(r.status === 200 && r.json.data.user.email === email, short(r.json));
});
await check('me without token -> 401', async () => {
  const r = await call('GET', `${API}/auth/me`, null, false);
  expect(r.status === 401, r.status);
});

// ── Repositories ──
await check(`analyze ${REPO}`, async () => {
  const r = await call('POST', `${API}/repositories/analyze`, { url: `https://github.com/${REPO}` });
  expect(r.status === 200 || r.status === 201, `${r.status} ${short(r.json)}`);
  repoId = (r.json.data?.repository ?? r.json.data)?.id;
  expect(repoId, 'no repository id: ' + short(r.json));
});
await check('list repositories', async () => ok(await call('GET', `${API}/repositories`)));
await check('get repository', async () => {
  const r = await call('GET', `${API}/repositories/${repoId}`);
  ok(r);
  const repo = r.json.data?.repository ?? r.json.data;
  issueId = repo?.issues?.[0]?.id;
  return `issues=${repo?.issues?.length ?? 0} contributors=${repo?.contributors?.length ?? 0}`;
});
await check('get unknown repository -> 404', async () => {
  const r = await call('GET', `${API}/repositories/doesnotexist`);
  expect(r.status === 404, r.status);
});

// ── Dashboard & analytics ──
await check('dashboard stats', async () => ok(await call('GET', `${API}/dashboard/stats`)));
await check('repository analytics', async () => ok(await call('GET', `${API}/analytics/repository/${repoId}`)));

// ── ML (via backend) ──
await check('ML: issue difficulty', async () => {
  if (!issueId) return 'skipped — repository has no open issues';
  ok(await call('POST', `${API}/ml/issues/${issueId}/predict-difficulty`));
});
await check('ML: contribution success', async () => ok(await call('POST', `${API}/ml/contribution/predict`,
  { user_skills: ['javascript', 'node'], repo_category: 'backend', issue_difficulty: 'easy' })));
await check('ML: cluster repository', async () => ok(await call('POST', `${API}/ml/repositories/${repoId}/cluster`)));
await check('ML: cluster all repositories', async () => ok(await call('POST', `${API}/ml/repositories/cluster-all`)));
await check('ML: cluster visualization', async () => ok(await call('GET', `${API}/ml/cluster/visualization`)));
await check('ML: cluster issues', async () => ok(await call('POST', `${API}/ml/repositories/${repoId}/cluster-issues`)));
await check('ML: explain repository', async () => ok(await call('POST', `${API}/ml/repositories/${repoId}/explain`)));
await check('ML: save profile', async () => ok(await call('PUT', `${API}/ml/profile`,
  { skills: ['javascript', 'react'], preferredLanguages: ['TypeScript'], contributionCount: 3 })));
await check('ML: get profile', async () => ok(await call('GET', `${API}/ml/profile`)));
await check('ML: recommendations', async () => ok(await call('GET', `${API}/ml/recommendations`)));
await check('ML: dashboard', async () => ok(await call('GET', `${API}/ml/dashboard`)));

// ── Cleanup ──
await check('delete repository', async () => {
  const r = await call('DELETE', `${API}/repositories/${repoId}`);
  expect(r.status === 200 || r.status === 204, `${r.status} ${short(r.json)}`);
});

for (const [status, name, detail] of results) {
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}${detail ? `  — ${detail}` : ''}`);
}
const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed (test user: ${email})`);
process.exit(failed ? 1 : 0);
