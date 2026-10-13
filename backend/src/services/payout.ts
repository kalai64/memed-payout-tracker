export type Milestone = { views: number; payout: number };

export function calculatePayout(views: number, milestones: Milestone[]): number {
  return milestones.reduce(
    (highest, milestone) =>
      views >= milestone.views ? Math.max(highest, milestone.payout) : highest,
    0,
  );
}

export function calculateBudgetedPayout(
  target: number,
  alreadyPaid: number,
  budget: number,
  spent: number,
) {
  const due = Math.max(0, target - alreadyPaid);
  const remaining = Math.max(0, budget - spent);
  const increment = Math.min(due, remaining);
  return {
    increment,
    totalPaid: alreadyPaid + increment,
    totalSpent: spent + increment,
    outstanding: due - increment,
  };
}

export function hasViewSpike(
  previous: number,
  next: number,
  lastUpdate: Date | null,
  now: Date,
): boolean {
  if (!lastUpdate) return false;
  const elapsed = now.getTime() - lastUpdate.getTime();
  return (
    elapsed >= 0 &&
    elapsed <= 60_000 &&
    next - previous >= 50_000 &&
    next >= Math.max(previous, 1) * 5
  );
}
