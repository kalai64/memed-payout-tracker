import { z } from 'zod';
import { ApiError } from './errors';

const money = z
  .number()
  .positive()
  .max(10_000_000)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
    'Use at most two decimal places',
  );
export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(8).max(72),
  role: z.enum(['brand', 'creator']),
});
export const loginSchema = signupSchema.pick({ email: true, password: true });
export const campaignSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    platform: z.enum(['Instagram', 'YouTube']),
    budget: money,
    milestones: z
      .array(z.object({ views: z.number().int().positive().max(1_000_000_000), payout: money }))
      .min(1)
      .max(20),
  })
  .superRefine((data, ctx) => {
    const ladder = [...data.milestones].sort((a, b) => a.views - b.views);
    ladder.forEach((milestone, index) => {
      if (milestone.payout > data.budget)
        ctx.addIssue({
          code: 'custom',
          path: ['milestones'],
          message: 'Each payout must fit within the total budget',
        });
      if (
        index > 0 &&
        (milestone.views === ladder[index - 1].views ||
          milestone.payout <= ladder[index - 1].payout)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['milestones'],
          message: 'View thresholds must be unique and payouts must increase with views',
        });
      }
    });
  });
export const viewsSchema = z.object({ views: z.number().int().min(0).max(1_000_000_000) });
export const postSchema = z.object({ postUrl: z.url().max(2048) });
export function normalizePostUrl(raw: string, platform: string): string {
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port)
    throw new ApiError(400, 'Use a public HTTPS post URL.');
  if (platform === 'Instagram') {
    if (
      !['instagram.com', 'www.instagram.com'].includes(host) ||
      !/^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)
    ) {
      throw new ApiError(400, 'Enter an Instagram post or reel URL.');
    }
    return `https://www.instagram.com${url.pathname.replace(/\/$/, '')}/`;
  }
  let videoId: string | null = null;
  if (host === 'youtu.be') videoId = url.pathname.slice(1);
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v');
    else videoId = url.pathname.match(/^\/(shorts|live)\/([A-Za-z0-9_-]+)\/?$/)?.[2] ?? null;
  }
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId))
    throw new ApiError(400, 'Enter a YouTube video or Shorts URL.');
  return `https://www.youtube.com/watch?v=${videoId}`;
}
