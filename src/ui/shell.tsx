import { useEffect, useState } from 'react';
import { BRIEF } from '../data/paramsMeta';
import { PRESETS } from '../data/presets';
import { useStore } from '../state/store';
import { encode, type Chapter } from '../state/urlState';
import { Chip, Segmented, Toggle } from './kit';

export const CHAPTERS: { n: Chapter; label: string; name: string }[] = [
  { n: 1, label: '1 Problem', name: 'Problem · data campus' },
  { n: 2, label: '2 Idea', name: 'Wide view' },
  { n: 3, label: '3 Fluid', name: 'Fluid · hill battery' },
  { n: 4, label: '4 Plant', name: 'Plant · floating solar' },
  { n: 5, label: '5 Limits', name: 'Limits · efficiency' },
  { n: 6, label: '6 Other storage', name: 'Other storage' },
];

export function TopBar() {
  const s = useStore();
  const share = async () => {
    const url = location.href.split('#')[0] + encode(s.params, s.chapter, s.mode);
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); s.notify('Link copied. It opens this exact scenario.'); }
    catch { s.notify('Link is in the address bar. Copy it from there.'); }
  };
  return (
    <header className="top">
      <div className="brand"><span className="mark" aria-hidden="true" /><h1 className="hd" style={{ margin: 0, fontSize: 24 }}>Store the sun for the night</h1><span style={{ fontSize: 14 }}>Simulator</span></div>
      <div className="row">
        {!s.presenter && <>
          <Chip onClick={s.undo} disabled={!s.history.past.length} label="Undo (Ctrl+Z)">Undo</Chip>
          <Chip onClick={s.redo} disabled={!s.history.future.length} label="Redo (Ctrl+Shift+Z)">Redo</Chip>
          <Chip onClick={share}>Share scenario</Chip>
          <Chip onClick={() => s.ui({ evidenceOpen: true })}>Evidence</Chip>
          <Chip onClick={() => s.ui({ presenter: true })} label="Presenter mode (P)">Present</Chip>
        </>}
        <Segmented label="Detail level" value={s.mode} onChange={s.setMode} options={[{ value: 'simple', label: 'Simple' }, { value: 'advanced', label: 'Advanced' }]} />
      </div>
    </header>
  );
}

export function ChapterTabs() {
  const chapter = useStore((s) => s.chapter), set = useStore((s) => s.setChapter);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (((chapter - 1 + (e.key === 'ArrowRight' ? 1 : -1)) % 6) + 6) % 6 + 1;
    set(n as Chapter);
    (document.getElementById('tab-' + n) as HTMLElement | null)?.focus();
  };
  return (
    <nav className="tabs" role="tablist" aria-label="Chapters" onKeyDown={onKey}>
      {CHAPTERS.map((c) => (
        <button key={c.n} id={'tab-' + c.n} role="tab" aria-selected={chapter === c.n} tabIndex={chapter === c.n ? 0 : -1} className="tab" onClick={() => set(c.n)}>{c.label}</button>
      ))}
    </nav>
  );
}

export function ScenarioBar() {
  const params = useStore((s) => s.params), apply = useStore((s) => s.apply);
  const compare = useStore((s) => s.compare), ui = useStore((s) => s.ui), resetAll = useStore((s) => s.resetAll), presenter = useStore((s) => s.presenter);
  const activeId = PRESETS.find((p) => JSON.stringify({ ...BRIEF, ...p.changes }) === JSON.stringify(params))?.id;
  return (
    <div className="row" style={{ gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Try a scenario</span>
      {PRESETS.map((p) => (
        <span key={p.id} title={p.shows}><Chip on={activeId === p.id} onClick={() => apply({ ...BRIEF, ...p.changes })}>{p.label}</Chip></span>
      ))}
      <span className="spacer" />
      <Toggle on={compare} onChange={(b) => ui({ compare: b })}>Compare with brief</Toggle>
      {!presenter && <button type="button" className="lk" onClick={resetAll}>Reset all</button>}
    </div>
  );
}

export interface KpiCell { label: string; value: string; sub: string; hl?: boolean; }
export function KpiBar({ cells }: { cells: KpiCell[] }) {
  // live region throttled to 2 Hz so screen readers are not flooded during playback
  const [spoken, setSpoken] = useState('');
  const text = cells.map((c) => `${c.label} ${c.value}`).join('. ');
  useEffect(() => { const t = setTimeout(() => setSpoken(text), 500); return () => clearTimeout(t); }, [text]);
  return (
    <section className="kpis" aria-label="Key numbers">
      {cells.map((c) => (
        <div className="kpi" key={c.label}>
          <div className="l">{c.label}</div>
          <div className="v hd num">{c.hl ? <span className="hl">{c.value}</span> : c.value}</div>
          <div className="d">{c.sub}</div>
        </div>
      ))}
      <div className="sr" aria-live="polite">{spoken}</div>
    </section>
  );
}

export function Footer({ name }: { name: string }) {
  return (
    <footer className="foot">
      <span className="sq" aria-hidden="true" />
      <span>{name}</span><span aria-hidden="true">·</span>
      <span>A model of our design under stated assumptions, not a forecast. Everything about the R-39 fluid is hypothetical and modelled, nothing measured; the only measured round trip is 59% at 500 kW (R-19, Cornwood).</span>
      <span className="spacer" />
      <span className="small muted">Tags: SIM brief · A assumption · E estimate · C calculated · S sourced · V vendor claim · ? unverified</span>
      <span className="small">builtbyjosef</span>
    </footer>
  );
}

export function Toast() {
  const t = useStore((s) => s.toast), notify = useStore((s) => s.notify);
  useEffect(() => { if (!t) return; const id = setTimeout(() => notify(null), 2600); return () => clearTimeout(id); }, [t, notify]);
  return t ? <div className="toast" role="status">{t}</div> : null;
}
