import { expect, test } from 'vitest';
import { clearDay, dailyYield, netGainVsLand, cellTemp } from '../index';
import { P } from './fixtures';
const near = (a: number, b: number, t: number) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(t);

test('cooling yields', () => {
  near(dailyYield(P(), 'land'), 3075.8, 0.5); near(dailyYield(P(), 'float'), 3106.9, 0.5);
  near(dailyYield(P(), 'film'), 3147.0, 0.5); near(dailyYield(P(), 'spray'), 3173.5, 0.5);
});
test('net gains', () => {
  near(netGainVsLand(P(), 'float') * 100, 1.0, 0.05); near(netGainVsLand(P(), 'film') * 100, 2.0, 0.05); near(netGainVsLand(P(), 'spray') * 100, 0.13, 0.05);
});
test('noon cell temperatures', () => {
  near(clearDay.tLand[48], 51.9, 0.05); near(clearDay.tFloat[48], 47.8, 0.05); near(clearDay.tFilm[48], 40.9, 0.05); near(clearDay.tSpray[48], 38.2, 0.05);
});
test('irradiance is a clean clear-day shape', () => {
  for (let i = 0; i < 96; i++) {
    const h = i / 4, f = h > 6 && h < 18 ? 0.6407 * Math.sin((Math.PI * (h - 6)) / 12) ** 1.3 : 0;
    near(clearDay.irr[i], f, 0.003);
  }
});
test('cloud cooling lowers noon temperature', () => {
  expect(cellTemp(P({ cloudCooling: true, sunshine: 0.5 }), 48)).toBeLessThan(clearDay.tFilm[48]);
  near(cellTemp(P({ cloudCooling: true, sunshine: 1 }), 48), clearDay.tFilm[48], 1e-9);
});
