'use client';
import { useState } from 'react';
import { ArrowRight, Info, LockKeyhole } from 'lucide-react';
import type { Flow, Intake } from '@/types/diagnostic';
import { useApp } from './providers';
import { Choice } from './choices';
export function IntakeForm({ flow, onStart }: { flow: Flow; onStart: (intake: Intake) => void }) {
  const { tx, m, pendingDescription } = useApp();
  const [platform, setPlatform] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [change, setChange] = useState('unsure');
  const [changeDetail, setChangeDetail] = useState('');
  const changes = [
    ['unsure', m.unknown],
    ['none', m.changeNone],
    ['update', m.changeUpdate],
    ['software', m.changeSoftware],
    ['hardware', m.changeHardware],
    ['driver', m.changeDriver],
    ['settings', m.changeSettings],
    ['crash', m.changeCrash],
    ['other', m.other],
  ] as const;
  function toggle(id: string) {
    setSymptoms((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : id === 'unsure'
          ? [id]
          : [...prev.filter((s) => s !== 'unsure'), id],
    );
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!platform || platform === 'other') return;
    onStart({
      platform: platform as Intake['platform'],
      symptoms: symptoms.map((s) =>
        s === 'other' ? other : s === 'unsure' ? 'Not sure' : flow.symptoms[Number(s)].en,
      ),
      change:
        changes.find((c) => c[0] === change)![1].en +
        (change === 'other' ? `: ${changeDetail}` : ''),
      context: pendingDescription,
    });
  }
  return (
    <div className="intake-layout">
      <div className="intake-intro">
        <span className="eyebrow">{tx(m.investigation)}</span>
        <h1>{tx(flow.title)}</h1>
        <p>{tx(flow.description)}</p>
        <div className="intro-note">
          <Info size={19} />
          <p>
            {tx(m.diagnoseFirst)}
            <br />
            {tx(m.contextBody)}
          </p>
        </div>
        <p className="muted small-text">
          <LockKeyhole size={14} />
          {tx(m.sessionPrivacy)}
        </p>
      </div>
      <form className="panel intake-form" onSubmit={submit}>
        <h2>{tx(m.contextTitle)}</h2>
        <fieldset>
          <legend>{tx(m.system)}</legend>
          <div className="choice-grid">
            {[
              ['windows11', 'Windows 11'],
              ['windows10', 'Windows 10'],
              ['unknown', tx(m.unknown)],
              ['other', tx(m.otherPlatform)],
            ].map(([id, label]) => (
              <Choice
                key={id}
                name="platform"
                value={id}
                label={label}
                checked={platform === id}
                onChange={() => setPlatform(id)}
              />
            ))}
          </div>
          {platform === 'unknown' && <p className="info-message">{tx(m.systemGuide)}</p>}
          {platform === 'other' && (
            <p role="alert" className="warning-message">
              {tx(m.unsupported)}
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>{tx(m.symptoms)}</legend>
          <p className="field-hint">{tx(m.selectAll)}</p>
          <div className="choice-grid">
            {[
              ...flow.symptoms.map((s, i) => [String(i), tx(s)]),
              ['unsure', tx(m.unknown)],
              ['other', tx(m.other)],
            ].map(([id, label]) => (
              <Choice
                key={id}
                name="symptoms"
                type="checkbox"
                value={id}
                label={label}
                checked={symptoms.includes(id)}
                onChange={() => toggle(id)}
              />
            ))}
          </div>
          {symptoms.includes('other') && (
            <label className="field-label">
              {tx(m.otherDetail)}
              <textarea
                value={other}
                onChange={(e) => setOther(e.target.value)}
                maxLength={1000}
                required
                rows={2}
              />
            </label>
          )}
        </fieldset>
        <label className="field-label" htmlFor="changed">
          {tx(m.changed)}
        </label>
        <select id="changed" value={change} onChange={(e) => setChange(e.target.value)}>
          {changes.map(([id, label]) => (
            <option key={id} value={id}>
              {tx(label)}
            </option>
          ))}
        </select>
        <p className="field-hint">{tx(m.changeHint)}</p>
        {change === 'other' && (
          <label className="field-label">
            {tx(m.otherDetail)}
            <textarea
              value={changeDetail}
              onChange={(e) => setChangeDetail(e.target.value)}
              maxLength={500}
              required
              rows={2}
            />
          </label>
        )}
        <button
          className="button primary full-width"
          disabled={
            !platform ||
            platform === 'other' ||
            (symptoms.includes('other') && !other.trim()) ||
            (change === 'other' && !changeDetail.trim())
          }
        >
          {tx(m.begin)}
          <ArrowRight size={17} />
        </button>
      </form>
    </div>
  );
}
