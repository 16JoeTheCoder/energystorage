import type { Params } from '../engine/types';
import { BRIEF, META, clampParam } from '../data/paramsMeta';

export type Chapter = 1 | 2 | 3 | 4 | 5 | 6;
export type Mode = 'simple' | 'advanced';

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function diffFromBrief(p: Params): Partial<Params> {
  const d: Record<string, unknown> = {};
  for (const k of Object.keys(BRIEF) as (keyof Params)[]) if (p[k] !== BRIEF[k]) d[k] = p[k];
  return d as Partial<Params>;
}

export function encode(p: Params, chapter: Chapter, mode: Mode) {
  return '#v1=' + b64(JSON.stringify({ p: diffFromBrief(p), c: chapter, m: mode }));
}

export function sanitize(raw: unknown): Params {
  const out: Params = { ...BRIEF };
  if (!raw || typeof raw !== 'object') return out;
  const o = out as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === 'storage') { if (v === 'hill' || v === 'co2' || v === 'heat') o[k] = v; continue; }
    if (k === 'heatBlock') { if (v === 'brick' || v === 'graphite' || v === 'ceramic') o[k] = v; continue; }
    const m = META.find((x) => x.id === k);
    if (!m) { if (k in BRIEF && typeof v === typeof (BRIEF as unknown as Record<string, unknown>)[k]) o[k] = v; continue; }
    const c = clampParam(m, v);
    if (c !== undefined) o[k] = c;
  }
  return out;
}

export function decode(hash: string): { params: Params; chapter: Chapter; mode: Mode } | null {
  const m = /#v1=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try {
    const j = JSON.parse(unb64(m[1]));
    const c = Number(j.c);
    return { params: sanitize(j.p), chapter: (c >= 1 && c <= 6 ? c : 2) as Chapter, mode: j.m === 'advanced' ? 'advanced' : 'simple' };
  } catch { return null; }
}
