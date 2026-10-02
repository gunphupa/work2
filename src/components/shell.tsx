'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useApp } from './providers';
import { Mark } from './icon';
export function Header() {
  const { locale, setLocale, tx, m } = useApp();
  const pathname = usePathname();
  return (
    <header className="header">
      <div className="nav container">
        <Link href="/" className="brand" aria-label="FixFlow home">
          <span className="brand-mark">
            <Mark />
          </span>
          FixFlow<span className="version">V1</span>
        </Link>
        <nav aria-label={locale === 'en' ? 'Main navigation' : 'เมนูหลัก'}>
          <Link className={pathname === '/how-it-works' ? 'active' : ''} href="/how-it-works">
            {tx(m.how)}
          </Link>
          <Link className={pathname === '/about' ? 'active' : ''} href="/about">
            {tx(m.about)}
          </Link>
        </nav>
        <div className="language" aria-label="Language">
          <button aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
            EN
          </button>
          <span aria-hidden="true">/</span>
          <button lang="th" aria-pressed={locale === 'th'} onClick={() => setLocale('th')}>
            ไทย
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  const { tx, m } = useApp();
  return (
    <footer className="footer container">
      <div>
        <Link href="/" className="brand small">
          <Mark />
          FixFlow
        </Link>
        <span>{tx(m.footer)}</span>
      </div>
      <Link href="/about">
        {tx(m.project)}
        <ArrowUpRight size={14} />
      </Link>
    </footer>
  );
}
