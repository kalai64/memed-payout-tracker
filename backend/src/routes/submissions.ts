import { Router } from 'express';
import { z } from 'zod';
import { Campaign } from '../models/Campaign';
import { Submission } from '../models/Submission';
import { authenticate, allowRole, currentUser } from '../middleware/auth';
import { ApiError } from '../lib/errors';
import { postSchema, viewsSchema, normalizePostUrl } from '../lib/validation';
import { updateViews } from '../services/updateViews';

export const submissionRouter = Router();
submissionRouter.use(authenticate);
submissionRouter.get('/', async (req, res) => {
  const user = currentUser(req);
  const filter =
    user.role === 'creator'
      ? { creator: user.id }
      : { campaign: { $in: await Campaign.find({ brand: user.id }).distinct('_id') } };
  const submissions = await Submission.find(filter)
    .populate('campaign', 'name platform milestones budget spent')
    .populate('creator', 'name')
    .sort({ createdAt: -1 })
    .lean();
  // Sum all records; earnings are independent of which campaigns still have funds.
  const totalEarnings =
    user.role === 'creator' ? submissions.reduce((sum, item) => sum + item.paid, 0) : null;
  res.json({ submissions, totalEarnings });
});
submissionRouter.post('/', allowRole('creator'), async (req, res) => {
  const data = postSchema
    .extend({ campaignId: z.string().regex(/^[a-fA-F0-9]{24}$/) })
    .parse(req.body);
  const campaign = await Campaign.findById(data.campaignId);
  if (!campaign) throw new ApiError(404, 'Campaign not found.');
  if (campaign.spent >= campaign.budget)
    throw new ApiError(409, 'This campaign has no remaining budget.');
  const postUrl = normalizePostUrl(data.postUrl, campaign.platform);
  const submission = await Submission.create({
    campaign: campaign.id,
    creator: currentUser(req).id,
    postUrl,
  });
  res.status(201).json({ submission });
});
// Simulation endpoint: either authenticated role can update any submission.
submissionRouter.patch('/:id/views', async (req, res) => {
  const id = z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid submission ID')
    .parse(req.params.id);
  const { views } = viewsSchema.parse(req.body);
  const result = await updateViews(id, views);
  res.json(result);
});
