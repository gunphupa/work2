'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Monitor,
  ScanLine,
  LoaderCircle,
  Circle,
  Search,
  LockKeyhole,
} from 'lucide-react';
import { catalog, categories } from '@/data/catalog';
import { interpretLocally, type Interpretation } from '@/ai/interpreter';
import { useApp } from './providers';
import { Icon } from './icon';
export function Home() {
  const { tx, m, locale, setPendingDescription } = useApp();
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<Interpretation | null>(null);
  const candidate = catalog.find((f) => f.id === match?.problemId);
  async function describe(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim().length < 2) {
      document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setBusy(true);
    setMatch(null);
    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error();
      setMatch(await response.json());
    } catch {
      setMatch({ ...interpretLocally(text), source: 'unavailable' });
    } finally {
      setBusy(false);
    }
  }
  function start(id: string) {
    setPendingDescription(text.trim());
    router.push(`/diagnose/${id}`);
  }
  const featured = ['slow', 'wifi', 'microphone'];
  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            {tx(m.heroEyebrow)}
          </div>
          <h1>
            {tx(m.heroTitle)
              .split('\n')
              .map((line, i) => (
                <span key={line} className={i ? 'accent-text' : ''}>
                  {line}
                </span>
              ))}
          </h1>
          <p className="hero-description">{tx(m.heroBody)}</p>
          <div className="hero-meta">
            <Monitor size={15} />
            {tx(m.windows)}
            <span className="meta-divider" />
            <ShieldCheck size={15} />
            {tx(m.privacyHint).split('.')[0]}
          </div>
        </div>
        <div className="diagnostic-illustration" aria-label={tx(m.demo)}>
          <div className="illustration-top">
            <span className="tiny-dot" />
            <span>{tx(m.demo)}</span>
            <GitBranch size={15} />
          </div>
          <div className="example-problem">
            <span className="icon-box">
              <Icon name="Mic" size={21} />
            </span>
            <div>
              <small>01 / {locale === 'en' ? 'AUDIO' : 'เสียง'}</small>
              <strong>{tx(m.demoProblem)}</strong>
            </div>
            <span className="pill">Windows</span>
          </div>
          <div className="example-checks">
            <div>
              <span className="done-node">
                <Check size={13} />
              </span>
              <span>{tx(m.demoCheck)}</span>
              <Check size={14} />
            </div>
            <div>
              <span className="done-node">
                <Check size={13} />
              </span>
              <span>{tx(m.demoInput)}</span>
              <Check size={14} />
            </div>
            <div className="current-example">
              <span className="active-node">
                <Circle size={10} />
              </span>
              <span>{tx(m.demoPermission)}</span>
              <ArrowRight size={15} />
            </div>
          </div>
          <div className="illustration-bottom">
            <ScanLine size={15} />
            {tx(m.demoFooter)}
          </div>
          <div className="floating-label">
            <span className="status-dot" />
            {tx(m.diagnoseFirst)}
          </div>
        </div>
      </section>
      <section className="describe-section container">
        <form className="describe-panel" onSubmit={describe}>
          <div className="describe-label">
            <Sparkles size={19} />
            <label htmlFor="problem-description">{tx(m.describe)}</label>
          </div>
          <div className="description-entry">
            <textarea
              id="problem-description"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setMatch(null);
              }}
              maxLength={1000}
              rows={2}
              placeholder={tx(m.placeholder)}
              aria-describedby="description-privacy"
            />
            <button className="button primary" disabled={busy} type="submit">
              {busy ? <LoaderCircle className="spin" size={17} /> : null}
              {busy ? tx(m.analyzing) : tx(m.start)}
              {!busy && <ArrowRight size={17} />}
            </button>
          </div>
          <div className="description-bottom">
            <span>{tx(m.describeHint)}</span>
            <span>
              <LockKeyhole size={12} />
              {tx(m.privacyHint)}
            </span>
          </div>
          <details className="privacy-details" id="description-privacy">
            <summary>{tx(m.textPrivacy)}</summary>
            <p>{tx(m.textService)}</p>
          </details>
        </form>
        <div aria-live="polite">
          {match && (
            <div className="match-panel">
              {match.source === 'unavailable' && <p className="muted">{tx(m.aiUnavailable)}</p>}
              {candidate && match.status === 'matched' ? (
                <>
                  <div>
                    <span className="eyebrow">{tx(m.matched)}</span>
                    <h3>{tx(candidate.title)}</h3>
                  </div>
                  <button className="button primary" onClick={() => start(candidate.id)}>
                    {tx(m.begin)}
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <p>
                  {tx(
                    match.status === 'unsupported'
                      ? m.unsupported
                      : match.status === 'off_topic'
                        ? m.offTopic
                        : m.noMatch,
                  )}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="quick-links">
          <span>{tx(m.popular)}</span>
          {featured.map((id) => {
            const f = catalog.find((f) => f.id === id)!;
            return (
              <button onClick={() => start(id)} key={id}>
                {tx(f.title)}
                <ArrowUpRight size={12} />
              </button>
            );
          })}
        </div>
      </section>
      <section className="problems-section container" id="problems">
        <div className="section-heading">
          <div>
            <h2>{tx(m.chooseTitle)}</h2>
            <p>{tx(m.chooseBody)}</p>
          </div>
          <span className="section-count">
            <GitBranch size={15} />
            {tx(m.flows)}
          </span>
        </div>
        <div className="category-tabs" role="group" aria-label={tx(m.chooseTitle)}>
          <button onClick={() => setCategory('all')} aria-pressed={category === 'all'}>
            <Search size={15} />
            {tx(m.all)}
          </button>
          {categories.map((c) => (
            <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              <Icon name={c.icon} size={16} />
              {tx(c.title)}
            </button>
          ))}
        </div>
        <div className="problem-grid">
          {catalog
            .filter((f) => category === 'all' || f.category === category)
            .map((f) => (
              <Link
                className="problem-card"
                key={f.id}
                href={`/diagnose/${f.id}`}
                onClick={() => setPendingDescription('')}
              >
                <div className="card-top">
                  <span className={`icon-box ${f.category}`}>
                    <Icon name={f.icon} size={21} />
                  </span>
                  <ArrowUpRight className="card-arrow" size={16} />
                </div>
                <h3>{tx(f.title)}</h3>
                <p>{tx(f.description)}</p>
                <div className="card-bottom">
                  <span>{tx(categories.find((c) => c.id === f.category)!.title)}</span>
                  <span>{tx(f.time)}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>
      <section className="principles container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {locale === 'en' ? 'THE FIXFLOW APPROACH' : 'แนวทางของ FIXFLOW'}
            </span>
            <h2>{tx(m.diagnoseFirst)}</h2>
            <p>{tx(m.diagnoseBody)}</p>
          </div>
          <Link className="text-link" href="/how-it-works">
            {tx(m.how)}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="principle-grid">
          {[
            [GitBranch, m.promise1, m.promise1Body],
            [ScanLine, m.promise2, m.promise2Body],
            [ShieldCheck, m.promise3, m.promise3Body],
          ].map(([Component, title, body], i) => {
            const I = Component as typeof GitBranch;
            return (
              <article key={i}>
                <I size={22} />
                <h3>{tx(title as typeof m.promise1)}</h3>
                <p>{tx(body as typeof m.promise1)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <div className="bottom-cta container">
        <span>
          <span className="status-dot" />
          {tx(m.windows)}
        </span>
        <a href="#problems">
          {tx(m.chooseTitle)}
          <ChevronRight size={16} />
        </a>
      </div>
    </main>
  );
}
