import mongoose from 'mongoose';
import { Campaign } from '../models/Campaign';
import { Submission } from '../models/Submission';
import { ApiError } from '../lib/errors';
import { calculatePayout, calculateBudgetedPayout, hasViewSpike } from './payout';

export async function updateViews(id: string, views: number) {
  const session = await mongoose.startSession();
  try {
    // withTransaction retries write conflicts. Both records commit together, or neither does.
    return await session.withTransaction(async () => {
      const submission = await Submission.findById(id).session(session);
      if (!submission) throw new ApiError(404, 'Submission not found.');
      const campaign = await Campaign.findById(submission.campaign).session(session);
      if (!campaign) throw new ApiError(404, 'Campaign not found.');
      const highestViews = Math.max(submission.highestViews, views);
      const target = calculatePayout(highestViews, campaign.milestones);
      const payout = calculateBudgetedPayout(
        target,
        submission.paid,
        campaign.budget,
        campaign.spent,
      );
      const now = new Date();
      submission.flagged ||= hasViewSpike(
        submission.views,
        views,
        submission.lastViewsUpdatedAt ?? null,
        now,
      );
      submission.views = views;
      submission.highestViews = highestViews;
      submission.paid = payout.totalPaid;
      submission.lastViewsUpdatedAt = now;
      if (payout.increment > 0) {
        campaign.spent = payout.totalSpent;
        await campaign.save({ session });
      }
      await submission.save({ session });
      return { submission, increment: payout.increment, outstanding: payout.outstanding };
    });
  } finally {
    await session.endSession();
  }
}
