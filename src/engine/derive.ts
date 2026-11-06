import { EFF, NIGHT_HOURS } from './constants';
import { simulateDay } from './dispatch';
import { solarSeries } from './solar';
import { co2Readouts } from './storeCo2';
import { hillCapacity } from './storeHill';
import type { DayResult, Params, StoreSpec } from './types';

export function efficiency(p: Params) {
  if (p.effCase === 'custom') { const e = Math.sqrt(p.rtCustom); return { ec: e, ed: e }; }
  return EFF[p.effCase];
}
export const roundTrip = (p: Params) => { const { ec, ed } = efficiency(p); return ec * ed; };

/** The store the dispatch runs with: hill (also for heat, which feeds a factory) or the CO2 dome. */
export function storeSpec(p: Params): StoreSpec {
  if (p.storage === 'co2') {
    const c = co2Readouts(p);
    return { capacity: p.co2CapacityMWh, pumpMax: p.co2ChargeMW, turbineMax: p.co2PowerMW, ec: c.ec, ed: c.ed };
  }
  const { ec, ed } = efficiency(p);
  return { capacity: hillCapacity(p), pumpMax: p.pumpMaxMW, turbineMax: p.turbineMaxMW, ec, ed };
}

export const simulate = (p: Params): DayResult => simulateDay(solarSeries(p), p.loadMW, storeSpec(p));

export function kpis(p: Params, r: DayResult) {
  const nightNeed = p.loadMW * NIGHT_HOURS;
  return {
    imported: r.totals.imported,
    delivered: r.totals.delivered,
    curtailed: r.totals.curtailed,
    direct: r.totals.direct,
    solar: r.totals.solar,
    nightNeed,
    nightCovered: Math.min(1, Math.max(0, 1 - r.totals.imported / nightNeed)),
    balance: r.totals.solar - (r.totals.direct + r.totals.chargeIn + r.totals.curtailed),
  };
}

/** Value of a 96-step series at a fractional hour (linear interpolation, wraps). */
export function at(series: ArrayLike<number>, hour: number) {
  const x = (((hour % 24) + 24) % 24) / 0.25;
  const i = Math.floor(x), f = x - i;
  const a = series[i % 96], b = series[(i + 1) % 96];
  return a + (b - a) * f;
}
