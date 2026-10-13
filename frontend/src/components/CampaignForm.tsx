'use client';
import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';

type Row = { key: number; views: string; payout: string };
export function CampaignForm({
  onCreated,
  onClose,
}: {
  onCreated: () => Promise<void>;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([
    { key: 0, views: '10000', payout: '500' },
    { key: 1, views: '50000', payout: '2000' },
    { key: 2, views: '100000', payout: '5000' },
  ]);
  const [nextKey, setNextKey] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function change(key: number, field: 'views' | 'payout', value: string) {
    setRows((items) =>
      items.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await api('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          platform: form.get('platform'),
          budget: Number(form.get('budget')),
          milestones: rows.map((row) => ({ views: Number(row.views), payout: Number(row.payout) })),
        }),
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel mb-8 p-6" aria-labelledby="create-title">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 id="create-title" className="text-xl font-bold">
            Create a campaign
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Set your budget and the milestones creators can earn.
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="Close campaign form"
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="campaign-name" className="label">
              Campaign name
            </label>
            <input
              id="campaign-name"
              name="name"
              className="input"
              required
              minLength={2}
              maxLength={120}
              placeholder="Summer launch"
            />
          </div>
          <div>
            <label htmlFor="platform" className="label">
              Platform
            </label>
            <select id="platform" name="platform" className="input">
              <option>Instagram</option>
              <option>YouTube</option>
            </select>
          </div>
          <div>
            <label htmlFor="budget" className="label">
              Total budget (₹)
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              className="input"
              required
              min="0.01"
              max="10000000"
              step="0.01"
              placeholder="10000"
            />
          </div>
        </div>
        <fieldset>
          <legend className="label">Milestone ladder</legend>
          <div className="mb-2 grid grid-cols-[1fr_1fr_36px] gap-3 text-xs text-slate-400">
            <span>View threshold</span>
            <span>Total payout (₹)</span>
          </div>
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div className="grid grid-cols-[1fr_1fr_36px] items-center gap-3" key={row.key}>
                <input
                  aria-label={`Milestone ${index + 1} views`}
                  className="input"
                  type="number"
                  min="1"
                  max="1000000000"
                  step="1"
                  required
                  value={row.views}
                  onChange={(event) => change(row.key, 'views', event.target.value)}
                />
                <input
                  aria-label={`Milestone ${index + 1} payout in rupees`}
                  className="input"
                  type="number"
                  min="0.01"
                  max="10000000"
                  step="0.01"
                  required
                  value={row.payout}
                  onChange={(event) => change(row.key, 'payout', event.target.value)}
                />
                <button
                  type="button"
                  aria-label={`Remove milestone ${index + 1}`}
                  disabled={rows.length === 1 || busy}
                  onClick={() => setRows(rows.filter((item) => item.key !== row.key))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={rows.length >= 20 || busy}
            onClick={() => {
              setRows([...rows, { key: nextKey, views: '', payout: '' }]);
              setNextKey(nextKey + 1);
            }}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-600"
          >
            <Plus size={16} /> Add milestone
          </button>
        </fieldset>
        <p className="text-xs leading-5 text-slate-500">
          Payouts are total earnings per post, not additional bonuses. Payouts must increase with
          view thresholds.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? 'Creating…' : 'Launch campaign'}
        </button>
      </form>
    </section>
  );
}
