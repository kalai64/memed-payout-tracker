import { Router } from 'express';
import { Campaign } from '../models/Campaign';
import { authenticate, allowRole, currentUser } from '../middleware/auth';
import { campaignSchema } from '../lib/validation';

export const campaignRouter = Router();
campaignRouter.use(authenticate);
campaignRouter.get('/', async (req, res) => {
  const user = currentUser(req);
  const filter =
    user.role === 'brand' ? { brand: user.id } : { $expr: { $lt: ['$spent', '$budget'] } };
  const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).lean();
  res.json({
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      remaining: campaign.budget - campaign.spent,
    })),
  });
});
campaignRouter.post('/', allowRole('brand'), async (req, res) => {
  const data = campaignSchema.parse(req.body);
  const campaign = await Campaign.create({
    brand: currentUser(req).id,
    name: data.name,
    platform: data.platform,
    budget: Math.round(data.budget * 100),
    milestones: data.milestones
      .sort((a, b) => a.views - b.views)
      .map((milestone) => ({ views: milestone.views, payout: Math.round(milestone.payout * 100) })),
  });
  res.status(201).json({ campaign });
});
