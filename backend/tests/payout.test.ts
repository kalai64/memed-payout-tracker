import { calculatePayout, calculateBudgetedPayout, hasViewSpike } from '../src/services/payout';

const ladder = [
  { views: 10_000, payout: 50_000 },
  { views: 50_000, payout: 200_000 },
  { views: 100_000, payout: 500_000 },
];
describe('highest crossed milestone', () => {
  test.each([
    [0, 0],
    [9_999, 0],
    [10_000, 50_000],
    [49_999, 50_000],
    [50_000, 200_000],
    [100_000, 500_000],
    [999_999, 500_000],
  ])('%i views earns %i paise', (views, payout) => {
    expect(calculatePayout(views, ladder)).toBe(payout);
  });
  test('jumping across milestones earns the highest amount, not their sum', () =>
    expect(calculatePayout(100_000, [...ladder].reverse())).toBe(500_000));
  test('empty ladder earns zero', () => expect(calculatePayout(100, [])).toBe(0));
});
describe('budget cap and incremental payments', () => {
  test('pays only the difference from the previous milestone', () => {
    expect(calculateBudgetedPayout(200_000, 50_000, 1_000_000, 50_000)).toEqual({
      increment: 150_000,
      totalPaid: 200_000,
      totalSpent: 200_000,
      outstanding: 0,
    });
  });
  test('partially pays when the budget runs out', () => {
    expect(calculateBudgetedPayout(500_000, 50_000, 300_000, 250_000)).toEqual({
      increment: 50_000,
      totalPaid: 100_000,
      totalSpent: 300_000,
      outstanding: 400_000,
    });
  });
  test('does not double-pay an identical update', () =>
    expect(calculateBudgetedPayout(200_000, 200_000, 1_000_000, 200_000).increment).toBe(0));
  test('decreasing views never removes money already paid', () =>
    expect(calculateBudgetedPayout(0, 50_000, 1_000_000, 50_000).totalPaid).toBe(50_000));
  test('an exhausted budget cannot pay', () =>
    expect(calculateBudgetedPayout(500_000, 0, 300_000, 300_000).increment).toBe(0));
  test('many sequential payouts never exceed the cap', () => {
    let spent = 0;
    for (let index = 0; index < 100; index++)
      spent = calculateBudgetedPayout(200_000, 0, 350_000, spent).totalSpent;
    expect(spent).toBe(350_000);
  });
});
describe('view spikes', () => {
  const now = new Date('2026-01-01T00:01:00Z');
  test('first update has no baseline', () =>
    expect(hasViewSpike(0, 100_000, null, now)).toBe(false));
  test('large fast growth is flagged', () =>
    expect(hasViewSpike(1000, 60_000, new Date(now.getTime() - 30_000), now)).toBe(true));
  test('slow growth is not flagged', () =>
    expect(hasViewSpike(1000, 60_000, new Date(now.getTime() - 120_000), now)).toBe(false));
});
