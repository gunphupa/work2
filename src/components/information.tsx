'use client';
import Link from 'next/link';
import { ArrowRight, FlaskConical, GitBranch, ShieldCheck, Focus } from 'lucide-react';
import { useApp } from './providers';
import { howSteps } from '@/i18n/messages';
export function Information({ page }: { page: 'how' | 'about' }) {
  const { tx, m, locale } = useApp();
  const about = page === 'about';
  const sections = [
    [FlaskConical, m.objective, m.objectiveBody],
    [GitBranch, m.approach, m.approachBody],
    [Focus, m.research, m.researchBody],
    [ShieldCheck, m.scope, m.scopeBody],
  ] as const;
  return (
    <main id="main" className="container information-page">
      <header className="information-hero">
        <span className="eyebrow">
          <span className="status-dot" />
          {tx(about ? m.project : m.how)}
        </span>
        <h1>{tx(about ? m.aboutTitle : m.howTitle)}</h1>
        <p>{tx(about ? m.aboutIntro : m.howIntro)}</p>
      </header>
      {about ? (
        <div className="about-grid">
          {sections.map(([Icon, title, body], i) => (
            <section className="panel" key={i}>
              <Icon size={23} />
              <h2>{tx(title)}</h2>
              <p>{tx(body)}</p>
            </section>
          ))}
        </div>
      ) : (
        <div className="how-steps">
          {howSteps.map(([title, body], i) => (
            <section key={i}>
              <span className="how-number">0{i + 1}</span>
              <div>
                <h2>{tx(title)}</h2>
                <p>{tx(body)}</p>
              </div>
            </section>
          ))}
        </div>
      )}
      {about && (
        <div className="privacy-project panel">
          <h2>{locale === 'en' ? 'Your data, kept simple' : 'ข้อมูลของคุณ ไม่ซับซ้อน'}</h2>
          <p>
            {tx(m.sessionPrivacy)} {tx(m.textService)}
          </p>
          <p>{tx(m.privacy)}</p>
        </div>
      )}
      <div className="information-cta">
        <h2>{tx(m.chooseTitle)}</h2>
        <Link className="button primary" href="/">
          {tx(m.start)}
          <ArrowRight size={17} />
        </Link>
      </div>
    </main>
  );
}
