'use client';
import Link from 'next/link';
import { ArrowUpRight, Check, TrendingUp } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link className="button-secondary" href={user ? `/${user.role}` : '/login'}>
          {user ? 'Open dashboard' : 'Log in'}
          <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="mx-auto grid max-w-6xl gap-14 px-6 py-16 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="mb-5 text-xs font-bold tracking-[.2em] text-orange-600">
            CONTENT THAT GOES PLACES
          </p>
          <h1 className="max-w-xl text-5xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
            Good content.
            <br />
            Real views.
            <br />
            <span className="text-orange-600">Clear payouts.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-500">
            Bring brands and creators together. Set milestones, share your posts, and see every
            rupee along the way.
          </p>
          <Link href="/signup" className="button mt-8">
            Let’s get started <ArrowUpRight size={18} />
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            Instagram & YouTube · Milestone-based earnings
          </p>
        </div>
        <div className="self-center rounded-3xl bg-[#f4f5f0] p-7 sm:p-10">
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Your next milestone</span>
              <TrendingUp className="text-orange-600" size={22} />
            </div>
            <p className="mt-7 text-5xl font-bold tracking-tight">
              ₹5,000<span className="ml-2 text-sm font-normal text-slate-400">at 100K views</span>
            </p>
            <div className="mt-6 h-2 rounded-full bg-orange-100">
              <div className="h-2 w-3/4 rounded-full bg-orange-600" />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              One post. A whole ladder of possibilities.
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {[
              'Brands stay within budget',
              'Creators see their earnings',
              'Every milestone counts',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-600">
                <Check size={18} className="text-orange-600" />
                {text}
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Illustrative milestone amounts. Campaigns set their own ladder.
          </p>
        </div>
      </section>
      <footer className="mx-auto max-w-6xl border-t border-slate-100 px-6 py-6 text-sm text-slate-400">
        Meme’d Campaign Payout Tracker
      </footer>
    </main>
  );
}
