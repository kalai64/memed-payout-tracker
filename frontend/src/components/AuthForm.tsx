'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Megaphone, Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from './AuthProvider';
import { api, errorMessage } from '@/lib/api';
import type { Role, User } from '@/lib/types';

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const { user, setUser, loading, error: connectionError } = useAuth();
  const [role, setRole] = useState<Role>('creator');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user && !loading) router.replace(`/${user.role}`);
  }, [user, loading, router]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
      ...(signup ? { name: String(form.get('name')).trim(), role } : {}),
    };
    try {
      const data = await api<{ user: User }>(`/auth/${signup ? 'signup' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUser(data.user);
      router.replace(`/${data.user.role}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-[#172923] p-12 text-white lg:flex">
        <Logo dark />
        <div>
          <p className="mb-5 text-sm text-orange-300">MADE FOR THE CREATOR ECONOMY</p>
          <h1 className="text-5xl leading-tight font-bold tracking-tight">
            Turn your reach
            <br />
            into rewards.
          </h1>
          <p className="mt-6 max-w-sm leading-7 text-slate-300">
            Simple campaigns. Transparent milestones. A better way for brands and creators to work
            together.
          </p>
        </div>
        <p className="text-sm text-slate-400">Instagram & YouTube campaigns</p>
      </aside>
      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-orange-600">
            ← Back to home
          </Link>
          <h2 className="mt-8 text-3xl font-bold tracking-tight">
            {signup ? 'Find your next opportunity.' : 'Welcome back.'}
          </h2>
          <p className="mt-3 mb-8 text-slate-500">
            {signup
              ? 'Create an account to start your journey.'
              : 'Log in to keep your campaigns moving.'}
          </p>
          <form onSubmit={submit} className="space-y-5">
            {signup && (
              <>
                <fieldset>
                  <legend className="label">I’m joining as a</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {(['creator', 'brand'] as const).map((item) => (
                      <label
                        key={item}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium capitalize ${role === item ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={item}
                          checked={role === item}
                          onChange={() => setRole(item)}
                          className="accent-orange-600"
                        />
                        {item === 'creator' ? <Sparkles size={16} /> : <Megaphone size={16} />}
                        {item}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label className="label" htmlFor="name">
                    {role === 'brand' ? 'Brand name' : 'Your name'}
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="input"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    placeholder={role === 'brand' ? 'Your brand' : 'Your full name'}
                  />
                </div>
              </>
            )}
            <div>
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                required
                minLength={8}
                maxLength={72}
                autoComplete={signup ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
              />
            </div>
            {(error || connectionError) && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error || connectionError}
              </p>
            )}
            <button className="button w-full" disabled={busy || loading}>
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">
            {signup ? 'Already have an account?' : 'New to Meme’d?'}{' '}
            <Link href={signup ? '/login' : '/signup'} className="font-semibold text-orange-600">
              {signup ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
