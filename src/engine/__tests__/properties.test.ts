import { expect, test } from 'vitest';
import { DT, simulate, storeSpec } from '../index';
import type { Params } from '../types';
import { P } from './fixtures';

const grid: Partial<Params>[] = [];
for (const sunshine of [0.25, 0.6, 1]) for (const arrayMWp of [200, 730, 2200]) for (const effCase of ['best', 'measured'] as const)
  for (const headM of [100, 500]) for (const loadMW of [20, 100, 300]) for (const storage of ['hill', 'co2'] as const)
    grid.push({ sunshine, arrayMWp, effCase, headM, loadMW, storage, sizing: headM === 100 ? 'fixedVolume' : 'fixedCapacity', turbineMaxMW: loadMW });

test.each(grid.map((g) => [JSON.stringify(g), g]))('invariants %s', (_n, g) => {
  const p = P(g as Partial<Params>), r = simulate(p), s = storeSpec(p), t = r.totals, e = 1e-6;
  expect(Math.abs(t.solar - (t.direct + t.chargeIn + t.curtailed))).toBeLessThan(e);
  expect(Math.abs(t.toStore - t.fromStore)).toBeLessThan(0.05); // steady state
  expect(Math.abs(t.direct + t.delivered + t.imported - p.loadMW * 24)).toBeLessThan(e);
  for (let i = 0; i < 96; i++) {
    for (const k of ['solar', 'direct', 'charge', 'discharge', 'curtailed', 'imported', 'store'] as const) {
      expect(Number.isFinite(r[k][i])).toBe(true); expect(r[k][i]).toBeGreaterThanOrEqual(-e);
    }
    expect(r.store[i]).toBeLessThanOrEqual(s.capacity + e);
    expect(r.charge[i]).toBeLessThanOrEqual(s.pumpMax + e);
    expect(r.discharge[i]).toBeLessThanOrEqual(s.turbineMax + e);
  }
  expect(DT).toBe(0.25);
});
