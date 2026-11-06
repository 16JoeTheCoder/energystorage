import { useMemo } from 'react';
import { BRIEF } from '../data/paramsMeta';
import { simulate, kpis, type DayResult, type Params } from '../engine';
import { useStore } from './store';

const cache = new Map<string, DayResult>();
export function simulateCached(p: Params): DayResult {
  const k = JSON.stringify(p);
  let r = cache.get(k);
  if (!r) { r = simulate(p); if (cache.size > 200) cache.clear(); cache.set(k, r); }
  return r;
}
export const BASELINE = simulate(BRIEF);
export const BASE_KPI = kpis(BRIEF, BASELINE);

export function useResult() {
  const params = useStore((s) => s.params);
  return useMemo(() => { const r = simulateCached(params); return { params, r, k: kpis(params, r) }; }, [params]);
}
