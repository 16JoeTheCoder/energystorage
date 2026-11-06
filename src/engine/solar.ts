import { clearDay, tempSeries } from './clearDay';
import { DT, STEPS } from './constants';
import type { Cooling, Params } from './types';

export const powerFactor = (t: number, tempCoeff: number) => 1 - tempCoeff * (t - 25);

/** Ambient estimate for cloud-cooling: night values interpolated linearly across daylight. */
function ambient(t: number[], i: number): number {
  const a = t[23], b = t[76]; // 05:45 and 19:00
  if (i <= 23) return t[i];
  if (i >= 76) return t[i];
  return a + ((b - a) * (i - 23)) / (76 - 23);
}

export function cellTemp(p: Pick<Params, 'cooling' | 'cloudCooling' | 'sunshine'>, i: number, cooling: Cooling = p.cooling): number {
  const t = tempSeries(cooling);
  if (!p.cloudCooling) return t[i];
  const amb = ambient(t, i);
  return amb + (t[i] - amb) * p.sunshine;
}

export function solarSeries(p: Params, cooling: Cooling = p.cooling): Float64Array {
  const out = new Float64Array(STEPS);
  for (let i = 0; i < STEPS; i++) {
    const v = p.arrayMWp * clearDay.irr[i] * p.sunshine * powerFactor(cellTemp(p, i, cooling), p.tempCoeff);
    out[i] = Math.max(0, v);
  }
  return out;
}

export const sum = (a: ArrayLike<number>) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
export const dailyYield = (p: Params, cooling: Cooling = p.cooling) => sum(solarSeries(p, cooling)) * DT;

export const coolingPump = (p: Params, c: Cooling) =>
  c === 'land' ? p.pumpLand : c === 'float' ? p.pumpFloat : c === 'film' ? p.pumpFilm : p.pumpSpray;

/** Net daily yield after the cooling pumps' own energy. */
export const netYield = (p: Params, c: Cooling = p.cooling) => dailyYield(p, c) - coolingPump(p, c);
export const netGainVsLand = (p: Params, c: Cooling = p.cooling) => netYield(p, c) / netYield(p, 'land') - 1;
