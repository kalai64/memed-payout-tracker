process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-test-secret-at-least-32-characters';
process.env.MONGO_URI = 'mongodb://localhost/unused';
process.env.FRONTEND_URL = 'http://localhost:3000';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { app } from '../src/app';
import { Campaign } from '../src/models/Campaign';
import { Submission } from '../src/models/Submission';
import { User } from '../src/models/User';

jest.setTimeout(180_000);
let replica: MongoMemoryReplSet;
beforeAll(async () => {
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1, args: ['--nounixsocket'] } });
  await mongoose.connect(replica.getUri());
  await Promise.all([User.init(), Campaign.init(), Submission.init()]);
});
afterAll(async () => {
  await mongoose.disconnect();
  if (replica) await replica.stop();
});

test('auth, roles, concurrent budget cap, repeat updates and earnings work together', async () => {
  const brand = request.agent(app);
  const creator = request.agent(app);
  await brand
    .post('/api/auth/signup')
    .send({ name: 'Test Brand', email: 'brand@test.com', password: 'password123', role: 'brand' })
    .expect(201);
  await creator
    .post('/api/auth/signup')
    .send({
      name: 'Test Creator',
      email: 'creator@test.com',
      password: 'password123',
      role: 'creator',
    })
    .expect(201);
  await creator.post('/api/campaigns').send({}).expect(403);
  const created = await brand
    .post('/api/campaigns')
    .send({
      name: 'Launch',
      platform: 'Instagram',
      budget: 750,
      milestones: [{ views: 10000, payout: 500 }],
    })
    .expect(201);
  const campaignId = created.body.campaign._id;
  const first = await creator
    .post('/api/submissions')
    .send({ campaignId, postUrl: 'https://www.instagram.com/p/first/' })
    .expect(201);
  const second = await creator
    .post('/api/submissions')
    .send({ campaignId, postUrl: 'https://www.instagram.com/reel/second/' })
    .expect(201);
  await creator
    .post('/api/submissions')
    .send({ campaignId, postUrl: 'https://instagram.com/p/first/?utm=duplicate' })
    .expect(409);
  await Promise.all(
    [first, second].map((item) =>
      creator
        .patch(`/api/submissions/${item.body.submission._id}/views`)
        .send({ views: 10000 })
        .expect(200),
    ),
  );
  const campaign = await Campaign.findById(campaignId).orFail();
  expect(campaign.spent).toBe(75000);
  const docs = await Submission.find({ campaign: campaignId });
  expect(docs.reduce((sum, item) => sum + item.paid, 0)).toBe(75000);
  await Promise.all(
    Array.from({ length: 6 }, () =>
      creator
        .patch(`/api/submissions/${first.body.submission._id}/views`)
        .send({ views: 10000 })
        .expect(200),
    ),
  );
  expect((await Campaign.findById(campaignId).orFail()).spent).toBe(75000);
  const earnings = await creator.get('/api/submissions').expect(200);
  expect(earnings.body.totalEarnings).toBe(75000);
  const live = await creator.get('/api/campaigns').expect(200);
  expect(live.body.campaigns).toHaveLength(0);
  await creator.post('/api/auth/logout').expect(204);
  await creator.get('/api/auth/me').expect(401);
  await creator
    .post('/api/auth/login')
    .send({ email: 'creator@test.com', password: 'password123' })
    .expect(200);
  await creator
    .patch(`/api/submissions/${first.body.submission._id}/views`)
    .send({ views: -1 })
    .expect(400);
  await brand.post('/api/submissions').send({}).expect(403);
  await request(app)
    .patch(`/api/submissions/${first.body.submission._id}/views`)
    .send({ views: 10000 })
    .expect(401);
});

test('concurrent updates to the same post pay once even with spare budget', async () => {
  const brand = request.agent(app);
  const creator = request.agent(app);
  await brand
    .post('/api/auth/login')
    .send({ email: 'brand@test.com', password: 'password123' })
    .expect(200);
  await creator
    .post('/api/auth/login')
    .send({ email: 'creator@test.com', password: 'password123' })
    .expect(200);
  const created = await brand
    .post('/api/campaigns')
    .send({
      name: 'Second launch',
      platform: 'YouTube',
      budget: 10000,
      milestones: [
        { views: 10000, payout: 500 },
        { views: 100000, payout: 5000 },
      ],
    })
    .expect(201);
  const campaignId = created.body.campaign._id;
  const posted = await creator
    .post('/api/submissions')
    .send({ campaignId, postUrl: 'https://youtu.be/dQw4w9WgXcQ' })
    .expect(201);
  const submissionId = posted.body.submission._id;
  await Promise.all(
    Array.from({ length: 5 }, () =>
      creator.patch(`/api/submissions/${submissionId}/views`).send({ views: 100000 }).expect(200),
    ),
  );
  expect((await Campaign.findById(campaignId).orFail()).spent).toBe(500000);
  expect((await Submission.findById(submissionId).orFail()).paid).toBe(500000);
  await creator.patch(`/api/submissions/${submissionId}/views`).send({ views: 10 }).expect(200);
  const corrected = await Submission.findById(submissionId).orFail();
  expect(corrected.views).toBe(10);
  expect(corrected.highestViews).toBe(100000);
  expect(corrected.paid).toBe(500000);
  expect((await Campaign.findById(campaignId).orFail()).spent).toBe(500000);
});
