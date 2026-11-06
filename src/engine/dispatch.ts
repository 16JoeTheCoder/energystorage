import { DT, STEPS } from './constants';
import type { DayResult, StoreSpec } from './types';

interface Raw extends Omit<DayResult, 'startStore' | 'minStore' | 'minStoreStep' | 'maxStore' | 'fullStep' | 'capacity' | 'ec' | 'ed' | 'iterations'> { end: number; }

export function runDay(solar: Float64Array, loadMW: number, s: StoreSpec, start: number): Raw {
  const mk = () => new Float64Array(STEPS);
  const r = { solar, direct: mk(), charge: mk(), discharge: mk(), curtailed: mk(), imported: mk(), store: mk() };
  let store = Math.min(Math.max(start, 0), s.capacity);
  const t = { solar: 0, direct: 0, chargeIn: 0, toStore: 0, delivered: 0, fromStore: 0, curtailed: 0, imported: 0 };
  for (let i = 0; i < STEPS; i++) {
    const sol = solar[i];
    const direct = Math.min(sol, loadMW);
    const surplus = sol - direct;
    const need = loadMW - direct;
    let charge = 0, discharge = 0, curtailed = 0;
    if (surplus > 0) {
      const room = s.ec > 0 ? (s.capacity - store) / DT / s.ec : 0;
      charge = Math.max(0, Math.min(s.pumpMax, surplus, room));
      store += charge * DT * s.ec;
      curtailed = surplus - charge;
    } else {
      const avail = (store * s.ed) / DT;
      discharge = Math.max(0, Math.min(need, s.turbineMax, avail));
      store -= s.ed > 0 ? (discharge * DT) / s.ed : 0;
    }
    store = Math.min(Math.max(store, 0), s.capacity);
    const imported = Math.max(0, need - discharge);
    r.direct[i] = direct; r.charge[i] = charge; r.discharge[i] = discharge;
    r.curtailed[i] = curtailed; r.imported[i] = imported; r.store[i] = store;
    t.solar += sol * DT; t.direct += direct * DT; t.chargeIn += charge * DT; t.toStore += charge * DT * s.ec;
    t.delivered += discharge * DT; t.fromStore += s.ed > 0 ? (discharge * DT) / s.ed : 0;
    t.curtailed += curtailed * DT; t.imported += imported * DT;
  }
  return { ...r, totals: t, end: store };
}

/** Steady state: repeat the same day until start and end agree (plan 5.4). */
export function simulateDay(solar: Float64Array, loadMW: number, s: StoreSpec): DayResult {
  let start = s.capacity / 2;
  let raw = runDay(solar, loadMW, s, start);
  let it = 1;
  while (Math.abs(raw.end - start) >= 0.01 && it < 200) {
    // relaxation: plain fixed-point is slow when the day is pump- or turbine-limited
    start = raw.end;
    raw = runDay(solar, loadMW, s, start);
    it++;
  }
  start = raw.end; // final pass from the converged start so start == end
  raw = runDay(solar, loadMW, s, start);
  let min = Infinity, minI = 0, max = -Infinity, full = -1;
  for (let i = 0; i < STEPS; i++) {
    const v = raw.store[i];
    if (v < min) { min = v; minI = i; }
    if (v > max) max = v;
    if (full < 0 && v >= s.capacity - 0.05) full = i;
  }
  const { end: _e, ...rest } = raw;
  return { ...rest, startStore: start, minStore: min, minStoreStep: minI, maxStore: max, fullStep: full, capacity: s.capacity, ec: s.ec, ed: s.ed, iterations: it };
}

/** Chain days from the steady state of the first (multi-day mode). */
export function simulateMulti(solarDays: Float64Array[], loadMW: number, s: StoreSpec) {
  const first = simulateDay(solarDays[0], loadMW, s);
  let start = first.startStore;
  return solarDays.map((sol) => { const d = runDay(sol, loadMW, s, start); start = d.end; return d; });
}
