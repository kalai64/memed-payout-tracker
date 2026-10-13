import Link from 'next/link';
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-xl text-white">
        m
      </span>
      Meme’d<span className="mt-1 text-orange-500">.</span>
    </Link>
  );
}
