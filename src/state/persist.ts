import type { Params } from '../engine/types';
import { diffFromBrief, sanitize } from './urlState';
const KEY = 'steam-sim-scenarios-v1';
export interface Saved { name: string; params: Partial<Params>; }
export function loadScenarios(): Saved[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => x && typeof x.name === 'string') : []; } catch { return []; }
}
export function saveScenario(name: string, p: Params): Saved[] {
  const list = loadScenarios().filter((s) => s.name !== name);
  list.unshift({ name, params: diffFromBrief(p) });
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20))); } catch { /* storage blocked */ }
  return list;
}
export function deleteScenario(name: string): Saved[] {
  const list = loadScenarios().filter((s) => s.name !== name);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage blocked */ }
  return list;
}
export const scenarioParams = (s: Saved) => sanitize(s.params);
