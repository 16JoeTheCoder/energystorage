import { at } from '../engine';
import type { DayResult } from '../engine/types';

/** Store level at a fractional hour (store[i] is the level after step i). */
export function storeAt(r: DayResult, h: number) {
  const hh = ((h % 24) + 24) % 24;
  if (hh < 0.25) return r.startStore + (r.store[0] - r.startStore) * (hh / 0.25);
  return at(r.store, hh - 0.25);
}
/** Step values (piecewise constant over each 15 min, which is what the dispatch assumes). */
export function sceneState(r: DayResult, hour: number) {
  const i = Math.min(95, Math.floor((((hour % 24) + 24) % 24) * 4));
  const store = storeAt(r, hour);
  return {
    i, store, frac: r.capacity > 0 ? Math.min(1, Math.max(0, store / r.capacity)) : 0,
    solar: at(r.solar, hour), direct: r.direct[i], charge: r.charge[i], discharge: r.discharge[i],
    curtailed: r.curtailed[i], imported: r.imported[i],
  };
}
export type SceneState = ReturnType<typeof sceneState>;

const hex = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
const mix = (a: string, b: string, t: number) => '#' + hex(a).map((v, k) => Math.round(v + (hex(b)[k] - v) * t).toString(16).padStart(2, '0')).join('');
const KEYS: [number, string, string][] = [
  [0, '#0E1730', '#26304A'], [5, '#0E1730', '#26304A'], [6, '#E59A6B', '#F5D7B0'], [9, '#8FBBD6', '#EBF2EC'],
  [15, '#8FBBD6', '#EBF2EC'], [18, '#D9774F', '#F2C79A'], [20, '#0E1730', '#26304A'], [24, '#0E1730', '#26304A'],
];
export function skyColors(hour: number): [string, string] {
  const h = ((hour % 24) + 24) % 24;
  for (let k = 0; k < KEYS.length - 1; k++) {
    const [h0, a0, b0] = KEYS[k], [h1, a1, b1] = KEYS[k + 1];
    if (h >= h0 && h <= h1) { const t = h1 === h0 ? 0 : (h - h0) / (h1 - h0); return [mix(a0, a1, t), mix(b0, b1, t)]; }
  }
  return [KEYS[0][1], KEYS[0][2]];
}
export const isNight = (h: number) => h < 6 || h >= 18;
/** quadratic arc M60 330 Q500 -150 940 330; x is linear in t */
export function sunPos(hour: number) {
  const t = (hour - 6) / 12;
  return { t, x: 60 + 880 * t, y: (1 - t) ** 2 * 330 + 2 * (1 - t) * t * -150 + t * t * 330 };
}
