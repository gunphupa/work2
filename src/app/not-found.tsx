'use client';
import Link from 'next/link';
import { useApp } from '@/components/providers';
export default function NotFound() {
  const { tx, m } = useApp();
  return (
    <main id="main" className="container empty-page">
      <span className="eyebrow">404</span>
      <h1>{tx(m.error)}</h1>
      <Link className="button primary" href="/">
        {tx(m.back)}
      </Link>
    </main>
  );
}
