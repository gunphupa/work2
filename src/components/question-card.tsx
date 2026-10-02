'use client';
import { useState } from 'react';
import { ArrowRight, HelpCircle, Info } from 'lucide-react';
import type { Question } from '@/types/diagnostic';
import { useApp } from './providers';
import { Choice } from './choices';
export function QuestionCard({
  node,
  step,
  onAnswer,
  onReading,
}: {
  node: Question;
  step: number;
  onAnswer: (answer: string, detail?: string) => void;
  onReading: (value: number) => void;
}) {
  const { tx, m } = useApp();
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState('');
  const [reading, setReading] = useState('');
  return (
    <article className="panel diagnostic-card">
      <div className="step-eyebrow">
        <span className="step-number">{String(step).padStart(2, '0')}</span>
        <span>{tx(m.guidedCheck)}</span>
      </div>
      <h1 tabIndex={-1} className="question-heading">
        {tx(node.title)}
      </h1>
      <div className="why-panel">
        <Info size={17} />
        <div>
          <strong>{tx(m.why)}</strong>
          <p>{tx(node.why)}</p>
        </div>
      </div>
      <h2 className="subheading">{tx(m.howCheck)}</h2>
      <ol className="guide-list">
        {node.guide.map((line, i) => (
          <li key={i}>
            <span>{i + 1}</span>
            <p>{tx(line)}</p>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (selected && selected !== 'unsure')
            onAnswer(selected, selected === 'other' ? detail : undefined);
        }}
      >
        <fieldset>
          <legend>{tx(m.result)}</legend>
          <div className="answer-options">
            {node.options.map((option) => (
              <Choice
                key={option.id}
                name="answer"
                value={option.id}
                checked={selected === option.id}
                label={tx(option.label)}
                onChange={() => setSelected(option.id)}
              />
            ))}
          </div>
        </fieldset>
        {selected === 'other' && (
          <label className="field-label">
            {tx(m.otherDetail)}
            <textarea
              autoFocus
              maxLength={1000}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              required
            />
          </label>
        )}
        {selected === 'unsure' ? (
          <div className="unsure-guide" role="status">
            <HelpCircle size={22} />
            <div>
              <h3>{tx(m.guideTitle)}</h3>
              <p>{tx(m.guideBody)}</p>
              <button type="button" className="text-link" onClick={() => onAnswer('unsure')}>
                {tx(m.skip)}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="question-actions">
            <button
              className="button primary"
              disabled={!selected || (selected === 'other' && !detail.trim())}
            >
              {tx(m.continue)}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </form>
      {node.input === 'range' && (
        <form
          className="reading-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (reading.trim()) onReading(Number(reading));
          }}
        >
          <label htmlFor="numeric-reading">{tx(m.reading)}</label>
          <div>
            <input
              id="numeric-reading"
              type="number"
              min={node.min}
              max={node.max}
              step="0.1"
              required
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="0–100"
            />
            <span>{node.unit}</span>
            <button className="button secondary" disabled={!reading.trim()}>
              {tx(m.useReading)}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
