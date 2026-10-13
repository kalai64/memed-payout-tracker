'use client';
import { useState } from 'react';
import { ExternalLink, TriangleAlert } from 'lucide-react';
import { api, currency, number, errorMessage } from '@/lib/api';
import type { Submission } from '@/lib/types';

function SubmissionRow({
  submission,
  creator,
  refresh,
}: {
  submission: Submission;
  creator: boolean;
  refresh: () => Promise<void>;
}) {
  const [views, setViews] = useState(String(submission.views));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const target = submission.campaign.milestones.reduce(
    (value, item) => (submission.highestViews >= item.views ? Math.max(value, item.payout) : value),
    0,
  );
  async function update(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ increment: number; outstanding: number }>(
        `/submissions/${submission._id}/views`,
        { method: 'PATCH', body: JSON.stringify({ views: Number(views) }) },
      );
      setMessage(
        `${currency(result.increment)} added.${result.outstanding ? ` ${currency(result.outstanding)} unpaid due to the budget cap.` : ''}`,
      );
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border-t border-slate-100 p-5 first:border-t-0">
      <div className="grid gap-5 lg:grid-cols-[1fr_100px_130px_280px] lg:items-center">
        <div className="min-w-0">
          <p className="font-semibold">{submission.campaign.name}</p>
          <p className="mt-1 text-xs text-slate-400">
            {creator
              ? submission.campaign.platform
              : `By ${submission.creator.name} · ${submission.campaign.platform}`}
          </p>
          <a
            href={submission.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-orange-600"
          >
            <span className="truncate">View submitted post</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
          {submission.flagged && (
            <p className="mt-2 flex items-center gap-1 text-xs text-amber-700">
              <TriangleAlert size={12} /> Unusual view spike flagged
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400">Current views</p>
          <p className="mt-1 font-semibold">{number(submission.views)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Earned</p>
          <p className="mt-1 font-bold text-emerald-700">{currency(submission.paid)}</p>
          {target > submission.paid && (
            <p className="mt-1 text-xs text-amber-700">
              {currency(target - submission.paid)} unpaid
            </p>
          )}
        </div>
        <form onSubmit={update}>
          <label className="mb-2 block text-xs text-slate-500" htmlFor={`views-${submission._id}`}>
            Simulate a view count
          </label>
          <div className="flex gap-2">
            <input
              className="input min-w-0"
              id={`views-${submission._id}`}
              aria-label={`Views for ${submission.campaign.name}`}
              type="number"
              min="0"
              max="1000000000"
              step="1"
              value={views}
              onChange={(event) => setViews(event.target.value)}
              required
            />
            <button className="button-secondary" disabled={busy}>
              {busy ? 'Saving…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
    </div>
  );
}
export function SubmissionList({
  submissions,
  creator,
  refresh,
}: {
  submissions: Submission[];
  creator: boolean;
  refresh: () => Promise<void>;
}) {
  return (
    <section className="mt-10">
      <div className="mb-5">
        <h2 className="text-xl font-bold">
          {creator ? 'Your posts' : 'Creator submissions'}{' '}
          <span className="ml-1 text-sm font-normal text-slate-400">({submissions.length})</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          View counts are simulated for this assessment. Update them to test the milestone payouts.
        </p>
      </div>
      <div className="panel overflow-hidden">
        {submissions.length ? (
          submissions.map((submission) => (
            <SubmissionRow
              key={submission._id}
              submission={submission}
              creator={creator}
              refresh={refresh}
            />
          ))
        ) : (
          <div className="p-10 text-center text-sm text-slate-400">
            {creator
              ? 'Submit your first post to start tracking your earnings.'
              : 'Creator posts will appear here once they join your campaigns.'}
          </div>
        )}
      </div>
    </section>
  );
}
