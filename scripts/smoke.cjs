const { createRequire } = require('node:module');
const path = require('node:path');
const { spawn } = require('node:child_process');
const requireApp = createRequire(path.join(process.cwd(), 'package.json'));
const { MongoMemoryReplSet } = requireApp('mongodb-memory-server');
const assert = require('node:assert/strict');
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let replica, backend, frontend;
async function ready(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await delay(300);
  }
  throw Error('Server not ready ' + url);
}
(async () => {
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1, args: ['--nounixsocket'] } });
  backend = spawn(process.execPath, ['backend/dist/server.js'], {
    env: {
      ...process.env,
      MONGO_URI: replica.getUri(),
      JWT_SECRET: 'local-ui-verification-secret-at-least-32-characters',
      FRONTEND_URL: 'http://localhost:3100',
      NODE_ENV: 'development',
      PORT: '4000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  backend.stderr.on('data', (d) => process.stderr.write(d));
  frontend = spawn(
    process.execPath,
    ['../node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3100'],
    {
      cwd: path.join(process.cwd(), 'frontend'),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  frontend.stderr.on('data', (d) => process.stderr.write(d));
  await ready('http://localhost:4000/api/health');
  await ready('http://localhost:3100');
  for (const route of ['/', '/login', '/signup', '/brand', '/creator']) {
    const response = await fetch('http://localhost:3100' + route);
    assert.equal(response.status, 200, 'Page ' + route);
  }
  async function api(pathname, body, cookie, method = 'POST') {
    const response = await fetch('http://localhost:3100/api' + pathname, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        Origin: 'http://localhost:3100',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = response.status === 204 ? null : await response.json();
    return { response, data };
  }
  const brand = await api('/auth/signup', {
    name: 'Proxy Brand',
    email: 'proxybrand@test.com',
    password: 'password123',
    role: 'brand',
  });
  assert.equal(brand.response.status, 201);
  const brandCookie = brand.response.headers.get('set-cookie').split(';')[0];
  assert.ok(brand.response.headers.get('set-cookie').includes('HttpOnly'));
  const campaign = await api(
    '/campaigns',
    {
      name: 'Proxy launch',
      platform: 'Instagram',
      budget: 750,
      milestones: [{ views: 10000, payout: 500 }],
    },
    brandCookie,
  );
  assert.equal(campaign.response.status, 201);
  const creator = await api('/auth/signup', {
    name: 'Proxy Creator',
    email: 'proxycreator@test.com',
    password: 'password123',
    role: 'creator',
  });
  assert.equal(creator.response.status, 201);
  const creatorCookie = creator.response.headers.get('set-cookie').split(';')[0];
  const submission = await api(
    '/submissions',
    { campaignId: campaign.data.campaign._id, postUrl: 'https://instagram.com/reel/proxyDemo/' },
    creatorCookie,
  );
  assert.equal(submission.response.status, 201);
  const payout = await api(
    '/submissions/' + submission.data.submission._id + '/views',
    { views: 10000 },
    creatorCookie,
    'PATCH',
  );
  assert.equal(payout.response.status, 200);
  assert.equal(payout.data.increment, 50000);
  const repeated = await api(
    '/submissions/' + submission.data.submission._id + '/views',
    { views: 10000 },
    creatorCookie,
    'PATCH',
  );
  assert.equal(repeated.data.increment, 0);
  const earnings = await api('/submissions', null, creatorCookie, 'GET');
  assert.equal(earnings.data.totalEarnings, 50000);
  const foreign = await fetch('http://localhost:3100/api/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: brandCookie,
      Origin: 'https://foreign.example',
    },
    body: JSON.stringify({}),
  });
  assert.equal(foreign.status, 403);
  const loggedOut = await api('/auth/logout', null, creatorCookie);
  assert.equal(loggedOut.response.status, 204);
  console.log(
    'PASS: production page routes and Next.js proxy: cookie auth, brand campaign, creator submission, payout, idempotent update, earnings, foreign-origin rejection and logout.',
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (frontend) frontend.kill();
    if (backend) backend.kill();
    if (replica) await replica.stop();
  });
