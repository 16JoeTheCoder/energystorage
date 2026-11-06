import { describe, expect, test } from 'vitest';
import { clearDay, kpis, simulate, at } from '../index';
import { P } from './fixtures';

const near = (a: number, b: number, tol: number) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe('brief day', () => {
  const r = simulate(P());
  test('totals', () => {
    near(r.totals.solar, 3147.0, 0.5); near(r.totals.direct, 1065.5, 0.5); near(r.totals.chargeIn, 1885.4, 0.5);
    near(r.totals.delivered, 1334.5, 0.5); near(r.totals.curtailed, 196.1, 0.5); near(r.totals.imported, 0, 1e-9);
  });
  test('steady-state start', () => near(r.startStore, 808.0, 0.2));
  test('min store at 07:00', () => { near(r.minStore, 18.1, 0.2); expect(r.minStoreStep).toBe(28); });
  test('store full mid-afternoon', () => { expect(r.fullStep).toBeGreaterThanOrEqual(60); expect(r.fullStep).toBeLessThanOrEqual(62); });
  test('first CSV row is start minus one 100 MW step', () => near(r.store[0], 808.0 - 100 * 0.25 / r.ed, 0.2));
  test('store trace matches the CSV when present', () => {
    if (clearDay.source !== 'csv') return;
    for (let i = 0; i < 96; i++) near(r.store[i], clearDay.ref.store_MWh[i], 0.2);
  });
  test('peak solar about 445 MW at noon', () => near(r.solar[48], 445.4, clearDay.source === 'csv' ? 0.5 : 2.5));
  test('interpolation', () => { near(at(r.solar, 12), r.solar[48], 1e-9); near(at(r.store, 23.99), r.store[95] + (r.store[0] - r.store[95]) * 0.96, 1e-6); });
});

const brief = (got: number, want: number) => near(got, want, Math.max(want * 0.01, 6));
describe('cloud', () => {
  test('70%', () => brief(simulate(P({ sunshine: 0.7 })).totals.imported, 537));
  test('50%', () => brief(simulate(P({ sunshine: 0.5 })).totals.imported, 1001));
  test('40%', () => brief(simulate(P({ sunshine: 0.4 })).totals.imported, 1238));
  test('25%', () => brief(simulate(P({ sunshine: 0.25 })).totals.imported, 1618));
});

describe('regression rows (plan 10.2)', () => {
  test('measured 59%', () => {
    // plan tolerance is ±1 against the CSV; with the synthesised clear day the gap is up to 5 MWh (decision.md)
    const r = simulate(P({ effCase: 'measured' }));
    near(r.totals.imported, 173.6, 6); near(r.totals.delivered, 1160.8, 6); near(r.totals.curtailed, 93.8, 6); near(r.startStore, 632.2, 6);
  });
  test('array 500', () => near(simulate(P({ arrayMWp: 500 })).totals.imported, 576.9, 1));
  test('array 1000', () => { const r = simulate(P({ arrayMWp: 1000 })); near(r.totals.imported, 0, 1e-9); near(r.totals.curtailed, 1372, 2); });
  test('double array', () => { const r = simulate(P({ arrayMWp: 1460 })); near(r.totals.imported, 0, 1e-9); near(r.totals.curtailed, 3366, 5); });
  test('load 150, turbines 150', () => near(simulate(P({ loadMW: 150, turbineMaxMW: 150 })).totals.imported, 928.1, 1));
  test('200 m fixed volume', () => {
    const r = simulate(P({ headM: 200, sizing: 'fixedVolume' }));
    near(r.capacity, 1046.4, 1); near(r.totals.imported, 434.4, 1); near(r.totals.curtailed, 809.9, 1);
  });
  test('200 m fixed capacity = same dispatch', () => {
    const a = simulate(P()), b = simulate(P({ headM: 200 }));
    expect(b.totals).toEqual(a.totals);
  });
  test('night covered', () => { expect(kpis(P(), simulate(P())).nightCovered).toBe(1); });
});
