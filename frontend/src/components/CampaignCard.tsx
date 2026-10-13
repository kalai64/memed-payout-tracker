'use client';
import { useState } from 'react';
import { Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import { api, currency, number, errorMessage } from '@/lib/api';
import type { Campaign } from '@/lib/types';

export function CampaignCard({
  campaign,
  creator,
  onSubmitted,
}: {
  campaign: Campaign;
  creator: boolean;
  onSubmitted: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const remaining = campaign.budget - campaign.spent;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const form = event.currentTarget;
    try {
      await api('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: campaign._id,
          postUrl: new FormData(form).get('postUrl'),
        }),
      });
      form.reset();
      setSuccess('Post submitted. Track it in Your posts below.');
      setOpen(false);
      await onSubmitted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-xl bg-slate-50 p-3 text-slate-700">
          {campaign.platform === 'Instagram' ? <Instagram size={21} /> : <Youtube size={21} />}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${remaining > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
        >
          {remaining > 0 ? 'Live campaign' : 'Budget exhausted'}
        </span>
      </div>
      <p className="mt-5 text-xs font-medium text-slate-400">{campaign.platform}</p>
      <h3 className="mt-1 text-lg font-bold">{campaign.name}</h3>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500">Budget remaining</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{currency(remaining)}</p>
        </div>
        <p className="text-xs text-slate-400">of {currency(campaign.budget)}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-orange-500"
          style={{ width: `${Math.min(100, (campaign.spent / campaign.budget) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {currency(campaign.spent)} spent · {Math.round((campaign.spent / campaign.budget) * 100)}%
        used
      </p>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400">MILESTONE LADDER</p>
        <div className="space-y-2">
          {campaign.milestones.map((item) => (
            <div key={item.views} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{number(item.views)} views</span>
              <span className="font-semibold">{currency(item.payout)}</span>
            </div>
          ))}
        </div>
      </div>
      {creator && remaining > 0 && (
        <div className="mt-auto pt-5">
          {open ? (
            <form onSubmit={submit} className="space-y-3">
              <label htmlFor={`post-${campaign._id}`} className="label">
                Your {campaign.platform} post URL
              </label>
              <input
                id={`post-${campaign._id}`}
                name="postUrl"
                type="url"
                required
                className="input"
                placeholder={
                  campaign.platform === 'Instagram'
                    ? 'https://instagram.com/reel/…'
                    : 'https://youtube.com/watch?v=…'
                }
              />
              <div className="flex gap-2">
                <button className="button flex-1" disabled={busy}>
                  {busy ? 'Submitting…' : 'Submit post'}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              className="button-secondary w-full"
              onClick={() => {
                setOpen(true);
                setSuccess('');
              }}
            >
              Submit a post
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {success}
        </p>
      )}
    </article>
  );
}
