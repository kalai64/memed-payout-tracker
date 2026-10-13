import { campaignSchema, normalizePostUrl, viewsSchema } from '../src/lib/validation';

test('rejects duplicate thresholds and decreasing payouts', () => {
  expect(
    campaignSchema.safeParse({
      name: 'Launch',
      platform: 'Instagram',
      budget: 5000,
      milestones: [
        { views: 100, payout: 500 },
        { views: 100, payout: 250 },
      ],
    }).success,
  ).toBe(false);
});
test('rejects invalid money and negative/fractional views', () => {
  expect(viewsSchema.safeParse({ views: -1 }).success).toBe(false);
  expect(viewsSchema.safeParse({ views: 1.5 }).success).toBe(false);
  expect(
    campaignSchema.safeParse({
      name: 'Launch',
      platform: 'YouTube',
      budget: 500.555,
      milestones: [{ views: 100, payout: 50 }],
    }).success,
  ).toBe(false);
});
test('normalizes links to prevent tracking-parameter duplicates', () => {
  expect(normalizePostUrl('https://instagram.com/reel/ABC123/?utm_source=test', 'Instagram')).toBe(
    'https://www.instagram.com/reel/ABC123/',
  );
  expect(normalizePostUrl('https://youtu.be/dQw4w9WgXcQ?t=5', 'YouTube')).toBe(
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  );
});
test('rejects deceptive domains and platform mismatch', () => {
  expect(() => normalizePostUrl('https://instagram.com.evil.test/p/ABC/', 'Instagram')).toThrow();
  expect(() => normalizePostUrl('https://youtu.be/dQw4w9WgXcQ', 'Instagram')).toThrow();
});
