'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  Wallet,
  Plus,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Logo } from './Logo';
import { CampaignForm } from './CampaignForm';
import { CampaignCard } from './CampaignCard';
import { SubmissionList } from './SubmissionList';
import { api, currency, errorMessage } from '@/lib/api';
import type { Campaign, Role, Submission } from '@/lib/types';

export function Dashboard({ role }: { role: Role }) {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const creator = role === 'creator';
  const refresh = useCallback(async () => {
    setError('');
    setRefreshing(true);
    try {
      const [campaignData, submissionData] = await Promise.all([
        api<{ campaigns: Campaign[] }>('/campaigns'),
        api<{ submissions: Submission[]; totalEarnings: number | null }>('/submissions'),
      ]);
      setCampaigns(campaignData.campaigns);
      setSubmissions(submissionData.submissions);
      setEarnings(submissionData.totalEarnings ?? 0);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== role) {
      router.replace(`/${user.role}`);
      return;
    }
    void refresh();
  }, [authLoading, user, role, router, refresh]);
  if (authLoading || !user || user.role !== role)
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Opening your dashboard…
      </main>
    );
  const budget = campaigns.reduce((sum, item) => sum + item.budget, 0);
  const spent = campaigns.reduce((sum, item) => sum + item.spent, 0);
  const stats = creator
    ? [
        {
          label: 'Total earnings',
          value: currency(earnings),
          note: 'Across all your posts',
          icon: Wallet,
        },
        {
          label: 'Live campaigns',
          value: String(campaigns.length),
          note: 'Ready for your next post',
          icon: Megaphone,
        },
        {
          label: 'Posts submitted',
          value: String(submissions.length),
          note: 'Your content in action',
          icon: CheckCircle2,
        },
      ]
    : [
        {
          label: 'Total campaign budget',
          value: currency(budget),
          note: `${campaigns.length} campaigns created`,
          icon: Megaphone,
        },
        { label: 'Budget spent', value: currency(spent), note: 'Paid to creators', icon: Wallet },
        {
          label: 'Budget remaining',
          value: currency(budget - spent),
          note: 'Available for milestones',
          icon: CheckCircle2,
        },
      ];
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 capitalize sm:inline">
              {role} workspace
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf1ec] text-sm font-semibold text-emerald-900">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="max-w-32 truncate text-sm font-medium">{user.name}</span>
            <button
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Log out"
              onClick={() => {
                void logout().catch((err) => setError(errorMessage(err)));
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="mb-7 flex items-center gap-2 text-xs font-medium text-slate-400">
          <LayoutDashboard size={14} /> Workspace / Overview
        </p>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[.15em] text-orange-600">
              {creator ? 'CREATE. SHARE. EARN.' : 'YOUR BRAND, THEIR REACH.'}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {creator ? 'Creator dashboard' : 'Campaign overview'}
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              {creator
                ? 'Discover campaigns and keep track of what your content earns.'
                : 'Keep your campaigns, budgets and creator payouts in one place.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="button-secondary"
              disabled={refreshing}
              onClick={() => void refresh()}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {!creator && (
              <button className="button" onClick={() => setShowForm(true)}>
                <Plus size={18} /> New campaign
              </button>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mb-9 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="panel p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <stat.icon size={19} className="text-orange-600" />
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{loading ? '—' : stat.value}</p>
              <p className="mt-2 text-xs text-slate-400">{stat.note}</p>
            </div>
          ))}
        </div>
        {showForm && !creator && (
          <CampaignForm onCreated={refresh} onClose={() => setShowForm(false)} />
        )}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {creator ? 'Explore live campaigns' : 'Your campaigns'}
            </h2>
            <span className="text-xs text-slate-400">{campaigns.length} campaigns</span>
          </div>
          {loading ? (
            <div className="panel p-10 text-center text-sm text-slate-400">Loading campaigns…</div>
          ) : campaigns.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  creator={creator}
                  onSubmitted={refresh}
                />
              ))}
            </div>
          ) : (
            <div className="panel px-6 py-14 text-center">
              <Megaphone size={30} className="mx-auto mb-4 text-orange-400" />
              <h3 className="font-semibold">
                {creator ? 'No live campaigns yet' : 'Your first campaign starts here'}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {creator
                  ? 'Check back soon or refresh to see new opportunities.'
                  : 'Create a campaign to invite creators and track their milestones.'}
              </p>
              {!creator && (
                <button className="button mt-5" onClick={() => setShowForm(true)}>
                  Create a campaign
                </button>
              )}
            </div>
          )}
        </section>
        {!loading && (
          <SubmissionList submissions={submissions} creator={creator} refresh={refresh} />
        )}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
          Meme’d · All amounts in INR. Milestone earnings are subject to the remaining campaign
          budget.
        </footer>
      </main>
    </div>
  );
}
