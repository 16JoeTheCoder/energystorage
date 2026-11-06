import { expect, test } from 'vitest';
import { BRIEF } from '../../data/paramsMeta';
import { decode, encode, sanitize } from '../urlState';
import { push, redo, undo } from '../history';

test('scenario round-trips through the URL', () => {
  const p = { ...BRIEF, sunshine: 0.4, headM: 200, effCase: 'measured' as const, heatDemandMW: 20 };
  const d = decode(encode(p, 3, 'advanced'))!;
  expect(d.params).toEqual(p); expect(d.chapter).toBe(3); expect(d.mode).toBe('advanced');
});
test('brief encodes to an empty diff', () => { expect(decode(encode(BRIEF, 2, 'simple'))!.params).toEqual(BRIEF); });
test('bad input falls back and clamps', () => {
  expect(decode('#v1=%%%')).toBeNull();
  expect(decode('#v1=bm90anNvbg')).toBeNull();
  const s = sanitize({ sunshine: 9, headM: -5, cooling: 'lava', evil: 1, arrayMWp: 'x', heatDemandMW: null });
  expect(s.sunshine).toBe(1); expect(s.headM).toBe(100); expect(s.cooling).toBe('film'); expect('evil' in s).toBe(false);
  expect(s.arrayMWp).toBe(730); expect(s.heatDemandMW).toBeNull();
});
test('history', () => {
  let h = push<number>({ past: [], future: [] }, 1); h = push(h, 2);
  const [h2, v] = undo(h, 3)!; expect(v).toBe(2);
  const [, w] = redo(h2, v)!; expect(w).toBe(3);
});
