import type { Params } from '../engine/types';

export interface Preset { id: string; label: string; changes: Partial<Params>; shows: string; }
export const PRESETS: Preset[] = [
  { id: 'brief', label: 'Brief default', changes: {}, shows: 'The reference day' },
  { id: 'cloudy', label: 'Cloudy week', changes: { sunshine: 0.4 }, shows: 'Import about 1,241 MWh per day' },
  { id: 'measured', label: 'Measured 59%', changes: { effCase: 'measured' }, shows: 'Import about 174 MWh/day' },
  { id: 'fallback', label: '200 m fallback', changes: { headM: 200 }, shows: 'Fluid volume 960,000 m³' },
  { id: 'double', label: 'Double array', changes: { arrayMWp: 1460 }, shows: 'More panels do not help once the store is full' },
  { id: 'water', label: 'Water instead', changes: { sg: 1 }, shows: 'Volume 1.92 M m³' },
  { id: 'r19', label: 'Real R-19', changes: { sg: 2.5 }, shows: 'Volume 768,000 m³' },
];
export const SUN_CHIPS = [
  { label: 'Clear', v: 1 }, { label: 'Hazy 70', v: 0.7 }, { label: 'Cloudy 40', v: 0.4 }, { label: 'Storm 25', v: 0.25 },
];
