import type { ReactNode } from 'react';
import type { Tag as TagT } from '../data/paramsMeta';
import { useStore } from '../state/store';

const TAG_NAMES: Record<TagT, string> = { S: 'sourced', C: 'calculated', 'C*': 'checked against the brief CSV', SIM: 'from the brief simulation', V: 'vendor claim', A: 'assumption', E: 'estimate from a model, not measured', '?': 'unverified' };
export function Tag({ t, light }: { t: TagT; light?: boolean }) {
  const ui = useStore((s) => s.ui);
  return (
    <button type="button" className="tg" data-weak={t === 'A' || t === 'E' || t === 'V' || t === '?'} style={light ? { borderColor: 'currentColor' } : undefined}
      title={`${t}: ${TAG_NAMES[t]}. Click for the evidence list.`} aria-label={`Evidence tag ${t}, ${TAG_NAMES[t]}`}
      onClick={(e) => { e.stopPropagation(); ui({ evidenceOpen: true }); }}>{t}</button>
  );
}

export function Chip({ on, onClick, children, disabled, label }: { on?: boolean; onClick: () => void; children: ReactNode; disabled?: boolean; label?: string }) {
  return <button type="button" className={'chip' + (on ? ' sel' : '')} aria-pressed={on} onClick={onClick} disabled={disabled} aria-label={label}>{children}</button>;
}

export function Toggle({ on, onChange, children }: { on: boolean; onChange: (b: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="toggle" onClick={() => onChange(!on)}>
      <span className="sw" aria-hidden="true" />{children}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <span className="segs" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o.value} role="radio" aria-checked={value === o.value} className={'seg' + (value === o.value ? ' sel' : '')} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </span>
  );
}
