import { useEffect, useId, useState } from 'react';
import type { Params } from '../engine/types';
import { BRIEF, META, Meta, ViewId, metaOf } from '../data/paramsMeta';
import { useStore } from '../state/store';
import { Chip, Tag, Toggle } from './kit';
import { fmt } from './format';

const isChanged = (p: Params, id: keyof Params) => p[id] !== BRIEF[id];
const show = (m: Meta, v: number) => fmt(v * (m.scale ?? 1), m.digits ?? 0);
const EFF_TAGS: Record<string, 'C' | 'A' | 'S'> = { best: 'C', planning: 'A', measured: 'S', custom: 'A' };

function briefText(m: Meta) {
  const v = BRIEF[m.id];
  if (v === null) return 'blank';
  if (m.kind === 'number') return show(m, v as number);
  if (m.kind === 'bool') return v ? 'on' : 'off';
  return m.choices!.find((c) => c.value === v)?.label ?? String(v);
}

export function ParamControl({ id, extra }: { id: keyof Params; extra?: React.ReactNode }) {
  const m = metaOf(id);
  const v = useStore((s) => s.params[id]);
  const params = useStore((s) => s.params);
  const set = useStore((s) => s.set);
  const begin = useStore((s) => s.begin), end = useStore((s) => s.end);
  const uid = useId();
  const changed = isChanged(params, id);
  const head = (
    <span className="lbl">{changed && <span className="dot" title="Changed from brief" aria-label="changed from brief" />}
      {m.kind === 'number' ? <label htmlFor={uid + 'n'}>{m.label}</label> : <span id={uid}>{m.label}</span>}<Tag t={m.tag} /></span>
  );
  const reset = changed ? <button type="button" className="lk" onClick={() => set(id, BRIEF[id] as never)}>Brief: {briefText(m)}</button> : <span className="small muted">Brief: {briefText(m)}</span>;

  if (m.kind === 'choice') {
    return (
      <div className="card ctl">
        <div className="ctl-h">{head}</div>
        <div className="row" style={{ gap: 6 }} role="group" aria-labelledby={uid}>
          {m.choices!.map((c) => (
            <Chip key={c.value} on={v === c.value} onClick={() => set(id, c.value as never)}>
              {c.label}{id === 'effCase' && <Tag t={EFF_TAGS[c.value]} />}
            </Chip>
          ))}
        </div>
        {m.note && <div className="note">{m.note}</div>}
        {extra}
        <div className="row" style={{ gap: 6 }}><span className="spacer" />{reset}</div>
      </div>
    );
  }
  if (m.kind === 'bool') {
    return (
      <div className="card ctl">
        <div className="ctl-h">{head}<Toggle on={v as boolean} onChange={(b) => set(id, b as never)}>{v ? 'On' : 'Off'}</Toggle></div>
        {m.note && <div className="note">{m.note}</div>}
      </div>
    );
  }
  return <NumberField m={m} v={v as number | null} uid={uid} head={head} reset={reset} extra={extra} set={(x, c) => set(id, x as never, c)} begin={begin} end={end} />;
}

function NumberField({ m, v, uid, head, reset, extra, set, begin, end }: {
  m: Meta; v: number | null; uid: string; head: React.ReactNode; reset: React.ReactNode; extra?: React.ReactNode;
  set: (v: number | null, commit?: boolean) => void; begin: () => void; end: () => void;
}) {
  const scale = m.scale ?? 1, digits = m.digits ?? 0;
  const text = v == null ? '' : (v * scale).toFixed(digits);
  const [draft, setDraft] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setDraft(null); }, [v]);
  const clamp = (x: number) => Math.min(m.max!, Math.max(m.min!, x));
  const confirm = () => {
    if (draft == null) return;
    const s = draft.trim().replace(/,/g, '');
    if (s === '' && m.nullable) { set(null); setDraft(null); return; }
    const n = Number(s);
    if (s === '' || !Number.isFinite(n)) { setDraft(null); setErr(`Enter a number between ${show(m, m.min!)} and ${show(m, m.max!)}.`); return; }
    const raw = n / scale;
    const c = clamp(raw);
    set(c);
    setDraft(null);
    setErr(c !== raw ? `Kept within ${show(m, m.min!)}–${show(m, m.max!)} ${m.unit ?? ''}.` : null);
  };
  const stepBy = (k: number) => set(clamp(+(((v ?? m.min!) + k * m.step!)).toFixed(10)));
  return (
    <div className="card ctl">
      <div className="ctl-h">{head}
        <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
          <button type="button" className="st" aria-label={`Decrease ${m.label}`} onClick={() => stepBy(-1)} disabled={v != null && v <= m.min!}>−</button>
          <input id={uid + 'n'} className="nb" inputMode="decimal" value={draft ?? text} placeholder={m.nullable ? 'e.g. 20' : undefined}
            aria-invalid={!!err} aria-describedby={err ? uid + 'e' : undefined}
            onChange={(e) => setDraft(e.target.value)} onBlur={confirm}
            onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { setDraft(null); setErr(null); } }} />
          {m.unit && <span style={{ fontSize: 14 }}>{m.unit}</span>}
          <button type="button" className="st" aria-label={`Increase ${m.label}`} onClick={() => stepBy(1)} disabled={v != null && v >= m.max!}>+</button>
        </span>
      </div>
      <input type="range" min={m.min} max={m.max} step={m.step} value={v ?? m.min} aria-label={m.label}
        aria-valuetext={v == null ? 'blank' : `${show(m, v)} ${m.unit ?? ''}`}
        onPointerDown={begin} onPointerUp={end} onKeyDown={begin} onKeyUp={end} onBlur={end}
        onChange={(e) => set(Number(e.target.value), false)} />
      {err && <div className="err" id={uid + 'e'} role="alert">{err}</div>}
      {m.note && <div className="note">{m.note}</div>}
      <div className="row" style={{ gap: 6 }}>{extra}<span className="spacer" />{reset}</div>
    </div>
  );
}

/** Generated from the parameter table: the right controls for this chapter and mode. */
export function AdjustPanel({ view, only, before, after }: { view: ViewId; only?: (keyof Params)[]; before?: React.ReactNode; after?: React.ReactNode }) {
  const mode = useStore((s) => s.mode);
  const extras = useExtras();
  const p = useStore((s) => s.params);
  const list = META.filter((m) => m.views.includes(view) && (!only || only.includes(m.id)) && (!m.when || m.when(p)));
  const visible = list.filter((m) => mode === 'advanced' || m.mode === 'simple');
  const hidden = list.filter((m) => m.mode === 'advanced');
  return (
    <aside className="side" aria-label="Adjust">
      <div className="side-head"><span className="hd" style={{ fontSize: 20 }}>Adjust</span><span className="small row" style={{ gap: 6 }}><span className="dot" /> = changed from brief</span></div>
      {before}
      {visible.map((m) => <ParamControl key={m.id} id={m.id} extra={extras[m.id]} />)}
      {mode === 'simple' && hidden.length > 0 && (
        <div className="hint"><b>Advanced adds {hidden.length} control{hidden.length > 1 ? 's' : ''}:</b> {hidden.map((m) => m.label.charAt(0).toLowerCase() + m.label.slice(1)).join(', ')}, each with its evidence tag.</div>
      )}
      {after}
    </aside>
  );
}

import { SUN_CHIPS } from '../data/presets';
function useExtras(): Partial<Record<keyof Params, React.ReactNode>> {
  const p = useStore((s) => s.params);
  const set = useStore((s) => s.set);
  return {
    sunshine: <span className="row" style={{ gap: 6 }}>{SUN_CHIPS.map((c) => <Chip key={c.v} on={p.sunshine === c.v} onClick={() => set('sunshine', c.v)}>{c.label}</Chip>)}</span>,
    arrayMWp: <span className="small">{fmt(p.arrayMWp / p.mwpPerHa)} ha · about {fmt(p.arrayMWp / (p.panelWp / 1e6) / 1e6, 2)} M panels</span>,
    headM: <span className="row" style={{ gap: 6 }}><Chip on={p.headM === 200} onClick={() => set('headM', 200)}>200 fallback</Chip><Chip on={p.headM === 300} onClick={() => set('headM', 300)}>300</Chip></span>,
    sg: <span className="small">Water 1.0 · R-19 2.5 (real) · R-39 family 3.0 (hypothetical)</span>,
  };
}
