import { create } from 'zustand';
import type { Params } from '../engine/types';
import { BRIEF } from '../data/paramsMeta';
import { History, push, redo, undo } from './history';
import { Chapter, Mode, decode } from './urlState';

interface State {
  params: Params;
  /** snapshot taken when a drag/typing gesture started; committed to history on end */
  pending: Params | null;
  history: History<Params>;
  chapter: Chapter; mode: Mode; compare: boolean; evidenceOpen: boolean; presenter: boolean;
  hour: number; playing: boolean; speed: 1 | 4 | 16;
  toast: string | null;
  /** live change (e.g. while dragging). commit=true records one history entry */
  set: <K extends keyof Params>(k: K, v: Params[K], commit?: boolean) => void;
  apply: (p: Partial<Params>) => void;
  begin: () => void; end: () => void;
  undo: () => void; redo: () => void;
  resetAll: () => void;
  setChapter: (c: Chapter) => void; setMode: (m: Mode) => void;
  setHour: (h: number) => void; setPlaying: (b: boolean) => void; setSpeed: (s: 1 | 4 | 16) => void;
  ui: (p: Partial<Pick<State, 'compare' | 'evidenceOpen' | 'presenter'>>) => void;
  notify: (t: string | null) => void;
}

const init = typeof location !== 'undefined' ? decode(location.hash) : null;

export const useStore = create<State>((set, get) => ({
  params: init?.params ?? { ...BRIEF },
  pending: null,
  history: { past: [], future: [] },
  chapter: init?.chapter ?? 2, mode: init?.mode ?? 'simple', compare: true, evidenceOpen: false, presenter: false,
  hour: 12, playing: false, speed: 4, toast: null,
  set: (k, v, commit = true) => {
    const s = get();
    if (s.params[k] === v) return;
    const next = { ...s.params, [k]: v };
    if (commit && !s.pending) set({ params: next, history: push(s.history, s.params) });
    else set({ params: next });
  },
  apply: (p) => { const s = get(); set({ params: { ...s.params, ...p }, history: push(s.history, s.params) }); },
  begin: () => { const s = get(); if (!s.pending) set({ pending: s.params }); },
  end: () => {
    const s = get();
    if (!s.pending) return;
    if (JSON.stringify(s.pending) !== JSON.stringify(s.params)) set({ history: push(s.history, s.pending), pending: null });
    else set({ pending: null });
  },
  undo: () => { const s = get(); const r = undo(s.history, s.params); if (r) set({ history: r[0], params: r[1] }); },
  redo: () => { const s = get(); const r = redo(s.history, s.params); if (r) set({ history: r[0], params: r[1] }); },
  resetAll: () => { const s = get(); if (JSON.stringify(s.params) !== JSON.stringify(BRIEF)) set({ params: { ...BRIEF }, history: push(s.history, s.params) }); },
  setChapter: (chapter) => set({ chapter }),
  setMode: (mode) => set({ mode }),
  setHour: (h) => set({ hour: ((h % 24) + 24) % 24 }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  ui: (p) => set(p),
  notify: (toast) => set({ toast }),
}));
