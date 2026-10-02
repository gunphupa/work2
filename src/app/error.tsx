'use client';
import Link from 'next/link';
import { useApp } from '@/components/providers';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { tx, m, locale } = useApp();
  return (
    <main id="main" className="container empty-page">
      <h1>{tx(m.error)}</h1>
      <button className="button primary" onClick={reset}>
        {locale === 'en' ? 'Try again' : 'ลองอีกครั้ง'}
      </button>
      <Link className="text-link" href="/">
        {tx(m.back)}
      </Link>
    </main>
  );
}
