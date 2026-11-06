import { expect, test } from 'vitest';
import { campus } from '../index';
import { P } from './fixtures';
const rel = (a: number, b: number) => expect(Math.abs(a / b - 1), `${a} vs ${b}`).toBeLessThanOrEqual(0.005);
test('campus', () => {
  const c = campus(P());
  rel(c.itMW, 87); rel(c.racks, 870); rel(c.flow, 3.98); rel(c.flowDay, 344000);
  expect(c.lakeWarmingKday).toBeCloseTo(0.03, 2);
});
