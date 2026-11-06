import { useEffect, useRef } from 'react';
import { useStore } from './state/store';
import { encode } from './state/urlState';
import { EvidenceDrawer } from './ui/EvidenceDrawer';
import { ChapterTabs, ScenarioBar, Toast, TopBar } from './ui/shell';
import { HillView, LimitsView, OtherView, ProblemView, SolarView, WideView } from './views/views';
import type { Chapter } from './state/urlState';

function usePlayback() {
  const playing = useStore((s) => s.playing);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now(), id = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      const s = useStore.getState();
      if (!document.hidden) s.setHour(s.hour + s.speed * dt * (24 / 60));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    const vis = () => { last = performance.now(); };
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(id); document.removeEventListener('visibilitychange', vis); };
  }, [playing]);
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const t = e.target as HTMLElement;
      const typing = t.closest('input, textarea, select, [contenteditable="true"]');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (typing && (t as HTMLInputElement).type !== 'range') return;
        e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || typing || s.evidenceOpen) return;
      const onWidget = t.closest('[role="slider"], [role="tab"], [role="radio"]');
      const k = e.key;
      if (k >= '1' && k <= '6') { s.setChapter(Number(k) as Chapter); return; }
      if (k === ' ' && !t.closest('button, [role="button"], a')) { e.preventDefault(); s.setPlaying(!s.playing); return; }
      if ((k === 'ArrowLeft' || k === 'ArrowRight') && !onWidget) { e.preventDefault(); s.setPlaying(false); s.setHour(Math.round(s.hour) + (k === 'ArrowRight' ? 1 : -1)); return; }
      const l = k.toLowerCase();
      if (l === 's') s.setMode(s.mode === 'simple' ? 'advanced' : 'simple');
      else if (l === 'c') s.ui({ compare: !s.compare });
      else if (l === 'r') s.resetAll();
      else if (l === 'e') s.ui({ evidenceOpen: true });
      else if (l === 'p') s.ui({ presenter: !s.presenter });
      else if (k === 'Escape' && s.presenter) s.ui({ presenter: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function useUrlSync() {
  const params = useStore((s) => s.params), chapter = useStore((s) => s.chapter), mode = useStore((s) => s.mode);
  const first = useRef(true);
  useEffect(() => {
    if (first.current && !location.hash) { first.current = false; return; }
    first.current = false;
    const id = setTimeout(() => { try { history.replaceState(null, '', encode(params, chapter, mode)); } catch { /* file:// in some browsers */ } }, 250);
    return () => clearTimeout(id);
  }, [params, chapter, mode]);
}

export default function App() {
  usePlayback(); useShortcuts(); useUrlSync();
  const chapter = useStore((s) => s.chapter), presenter = useStore((s) => s.presenter);
  useEffect(() => { document.documentElement.classList.toggle('presenter', presenter); }, [presenter]);
  const View = [ProblemView, WideView, HillView, SolarView, LimitsView, OtherView][chapter - 1];
  return (
    <div className="app">
      <TopBar />
      <ChapterTabs />
      <ScenarioBar />
      <main id={'panel-' + chapter} role="tabpanel" aria-labelledby={'tab-' + chapter} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <View />
      </main>
      <EvidenceDrawer />
      <Toast />
      {presenter && <div className="chapno" aria-hidden="true">{chapter} / 6 · Esc leaves presenter mode</div>}
    </div>
  );
}
