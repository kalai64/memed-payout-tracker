export type Role = 'brand' | 'creator';
export type User = { id: string; name: string; email: string; role: Role };
export type Milestone = { views: number; payout: number };
export type Campaign = {
  _id: string;
  name: string;
  platform: 'Instagram' | 'YouTube';
  budget: number;
  spent: number;
  remaining: number;
  milestones: Milestone[];
};
export type Submission = {
  _id: string;
  campaign: Campaign;
  creator: { _id: string; name: string };
  postUrl: string;
  views: number;
  highestViews: number;
  paid: number;
  flagged: boolean;
};
