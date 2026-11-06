export interface History<T> { past: T[]; future: T[]; }
export const MAX_HISTORY = 100;
export function push<T>(h: History<T>, prev: T): History<T> {
  return { past: [...h.past, prev].slice(-MAX_HISTORY), future: [] };
}
export function undo<T>(h: History<T>, cur: T): [History<T>, T] | null {
  if (!h.past.length) return null;
  const prev = h.past[h.past.length - 1];
  return [{ past: h.past.slice(0, -1), future: [cur, ...h.future] }, prev];
}
export function redo<T>(h: History<T>, cur: T): [History<T>, T] | null {
  if (!h.future.length) return null;
  const next = h.future[0];
  return [{ past: [...h.past, cur], future: h.future.slice(1) }, next];
}
