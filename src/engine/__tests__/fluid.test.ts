import { describe, expect, test } from 'vitest';
import { fluidFacts, kdViscosity, solidsVol, solidsWt, type FluidIn } from '../fluid';

const near = (v: number, want: number, tol = 0.02) => expect(Math.abs(v - want) / want).toBeLessThanOrEqual(tol);
const base: FluidIn = { recipe: 'r39m', sg: 3, millScaleSG: 5.2, redMudPct: 3, d50um: 10, carrierMult: 5, tankHeightM: 8, headM: 300, ed: 0.8601, volumeM3: 640000 };
const vol = (sg: number) => (1569.6 * 1000) / (0.002725 * 300 * sg);
const f = (o: Partial<FluidIn>) => fluidFacts({ ...base, volumeM3: vol(o.sg ?? 3), ...o });

describe('loading', () => {
  test.each([[3, 5.2, 47.6, 82.5], [2.5, 4.2, 46.9, 78.8], [3, 5.0, 50.0, 83.3]])('SG %s solid %s', (sg, s, v, w) => {
    const phi = solidsVol(sg, s); near(phi * 100, v); near(solidsWt(phi, s, sg) * 100, w);
  });
});

describe('viscosity (Krieger–Dougherty)', () => {
  test('R-19', () => near(f({ recipe: 'r19', sg: 2.5 }).viscosity, 10.8));
  test.each([[2.8, 7.1], [3.0, 11.6], [3.2, 22.5]])('mill scale SG %s', (sg, mu) => near(f({ sg }).viscosity, mu));
  test('two-size', () => near(f({ recipe: 'r39d' }).viscosity, 8.4));
  test('15 vol% red mud', () => near(f({ recipe: 'r39r', redMudPct: 15 }).viscosity, 21.2));
  test('5 vol% red mud', () => near(f({ recipe: 'r39r', redMudPct: 5 }).viscosity, 13.6));
  test('jams at the packing limit', () => expect(kdViscosity(0.64, 0.64)).toBe(Infinity));
});

describe('cost, mid case with freight, 300 m, ed 0.8601', () => {
  // magnetite is not a recipe; check it via the same formula
  test.each([['r19', 2.5, 168, 239, 323e6], ['r39m', 3, 95, 135, 183e6], ['r39f', 3, 112, 160, 215e6]] as const)('%s', (recipe, sg, t, kwh, bill) => {
    const x = f({ recipe, sg }); near(x.perTonne, t, 0.03); near(x.perKWh, kwh, 0.03); near(x.bill, bill, 0.03);
  });
  test('magnetite', () => {
    const phi = solidsVol(3, 5.2); const m3 = phi * 5.2 * 156 + 18;
    near(m3 / 3, 135, 0.03); near(m3 / 3 / (0.002725 * 300 * 0.8601), 192, 0.03); near(m3 * 640000, 259e6, 0.03);
  });
  test('mill scale bill is not cheaper than the lithium reference', () => expect(f({}).billVsLithium).toBeGreaterThan(1));
});

describe('supply, settling, stability', () => {
  test('mill scale tonnes and years of Indonesian output', () => {
    const x = f({}); near(x.millScaleT, 1.58e6); near(x.years![0], 2.8); near(x.years![1], 8.3);
  });
  test('settling d50 10 µm, 5× carrier', () => near(f({}).settlingCmDay, 20, 0.05));
  test('stability load at 8 m', () => near(f({}).stabilityKPa, 157));
  test('relative loading of R-39M', () => near(f({}).relLoading, 0.744));
});
