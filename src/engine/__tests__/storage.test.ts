import { expect, test } from 'vitest';
import { co2Readouts, efficiency, heatReadouts, hillPhysics, roundTrip, simulate, storeSpec } from '../index';
import { P } from './fixtures';
const near = (a: number, b: number, t: number) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(t);

test('hill physics', () => {
  const h = hillPhysics(P(), efficiency(P()).ed);
  near(h.energyPerM3, 2.4525, 0.01); near(h.pressure, 8.83, 0.01); near(h.jet, 74.4, 0.05); near(h.wear, 2.83, 0.01); near(h.hoursAtLoad, 13.5, 0.01);
  near(h.volume, 640000, 100); near(h.deliveredPerFull, 1350, 1);
});
test('fluid volumes', () => {
  near(hillPhysics(P({ sg: 1 }), 0.86).volume, 1920000, 100);
  near(hillPhysics(P({ sg: 2.5 }), 0.86).volume, 768000, 100);
  near(hillPhysics(P({ headM: 200 }), 0.86).volume, 960000, 100);
});
test('efficiency cases', () => {
  near(roundTrip(P()), 0.708, 0.001); near(roundTrip(P({ effCase: 'best' })), 0.793, 0.001);
  near(roundTrip(P({ effCase: 'measured' })), 0.584, 0.001); near(roundTrip(P({ effCase: 'custom', rtCustom: 0.5 })), 0.5, 1e-9);
});
test('co2', () => {
  const c = co2Readouts(P());
  near(c.vsLargest, 6.75, 0.01); near(c.co2Tonnes, 13500, 1); near(c.energyInPerNight, 1800, 1); near(c.hours, 13.5, 0.01);
  const r = simulate(P({ storage: 'co2' }));
  expect(storeSpec(P({ storage: 'co2' })).capacity).toBe(1350);
  expect(r.totals.imported).toBeGreaterThanOrEqual(0);
});
test('heat', () => {
  const h = heatReadouts(P());
  expect(h.heatNeeded).toBeNull(); near(h.heatFor1350, 4286, 1); expect(h.unitsFor1350).toBe(43);
  const f = heatReadouts(P({ heatDemandMW: 20 }));
  near(f.heatNeeded!, 270, 1e-9); expect(f.units).toBe(3);
});
