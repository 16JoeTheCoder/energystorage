import type { Params } from '../engine/types';

export type Tag = 'S' | 'C' | 'C*' | 'SIM' | 'V' | 'A' | 'E' | '?';
export type ViewId = 'problem' | 'wide' | 'hill' | 'solar' | 'limits' | 'other';

export interface Meta {
  id: keyof Params;
  label: string;
  unit?: string;
  kind: 'number' | 'choice' | 'bool';
  min?: number; max?: number; step?: number;
  choices?: { value: string; label: string }[];
  /** display = value * scale (e.g. fraction -> %) */
  scale?: number;
  digits?: number;
  tag: Tag;
  mode: 'simple' | 'advanced';
  views: ViewId[];
  note?: string;
  evidenceId?: string;
  nullable?: boolean;
  /** only shown when this holds */
  when?: (p: Params) => boolean;
}

export const BRIEF: Params = {
  sunshine: 1, arrayMWp: 730, cooling: 'film', tempCoeff: 0.003, cloudCooling: false,
  pumpLand: 0, pumpFloat: 0.4, pumpFilm: 9.7, pumpSpray: 93.7,
  panelWp: 700, mwpPerHa: 0.83,
  loadMW: 100, pue: 1.15, rackKW: 100, lakeRiseK: 6, lakeVolM3: 6.9e7,
  storage: 'hill',
  headM: 300, sg: 3, recipe: 'r39m', millScaleSG: 5.2, redMudPct: 3, d50um: 10, carrierMult: 5, tankHeightM: 8, sizing: 'fixedCapacity', capacityMWh: 1569.6, volumeM3: 640000,
  pumpMaxMW: 300, turbineMaxMW: 100, turbineUnits: 4,
  effCase: 'planning', rtCustom: 0.708, jetCv: 0.97, wearRefHead: 150,
  co2CapacityMWh: 1350, co2PowerMW: 100, co2ChargeMW: 300, co2RoundTrip: 0.75,
  heatDemandMW: null, heatHours: 13.5, heatUnitMWh: 100, heatBlock: 'brick',
};

const W: ViewId[] = ['wide'];
export const META: Meta[] = [
  { id: 'sunshine', label: 'Sunshine', unit: '%', kind: 'number', min: 0.25, max: 1, step: 0.01, scale: 100, digits: 0, tag: 'A', mode: 'simple', views: ['wide', 'solar'], note: 'Clear-day shape scaled down. Not real weather.' },
  { id: 'arrayMWp', label: 'Solar array', unit: 'MWp', kind: 'number', min: 200, max: 2200, step: 10, digits: 0, tag: 'SIM', mode: 'simple', views: ['wide', 'solar'] },
  { id: 'cooling', label: 'Panel cooling', kind: 'choice', choices: [{ value: 'land', label: 'Land' }, { value: 'float', label: 'Floating' }, { value: 'film', label: 'Floating + film' }, { value: 'spray', label: 'Floating + spray' }], tag: 'SIM', mode: 'simple', views: ['solar'], note: 'The reference day uses floating + film.' },
  { id: 'tempCoeff', label: 'Temperature coefficient', unit: '%/°C', kind: 'number', min: 0.001, max: 0.006, step: 0.0001, scale: 100, digits: 2, tag: 'A', mode: 'advanced', views: ['solar'] },
  { id: 'cloudCooling', label: 'Clouds cool the cells', kind: 'bool', tag: 'A', mode: 'advanced', views: ['solar'], note: 'Off by default: plain scaling matches the brief better.' },
  { id: 'panelWp', label: 'Panel size', unit: 'Wp', kind: 'number', min: 300, max: 800, step: 10, digits: 0, tag: 'A', mode: 'advanced', views: ['solar'] },
  { id: 'mwpPerHa', label: 'Array density', unit: 'MWp/ha', kind: 'number', min: 0.4, max: 1.2, step: 0.01, digits: 2, tag: 'C', mode: 'advanced', views: ['solar'] },
  { id: 'pumpFloat', label: 'Pump energy, floating', unit: 'MWh/day', kind: 'number', min: 0, max: 200, step: 0.1, digits: 1, tag: 'C*', mode: 'advanced', views: ['solar'], note: 'Back-solved from the brief’s net gains; replace with real pump specs.' },
  { id: 'pumpFilm', label: 'Pump energy, film', unit: 'MWh/day', kind: 'number', min: 0, max: 200, step: 0.1, digits: 1, tag: 'C*', mode: 'advanced', views: ['solar'], note: 'Back-solved from the brief’s net gains.' },
  { id: 'pumpSpray', label: 'Pump energy, spray', unit: 'MWh/day', kind: 'number', min: 0, max: 200, step: 0.1, digits: 1, tag: 'C*', mode: 'advanced', views: ['solar'], note: 'Back-solved from the brief’s net gains.' },
  { id: 'loadMW', label: 'Campus load', unit: 'MW', kind: 'number', min: 20, max: 300, step: 5, digits: 0, tag: 'A', mode: 'simple', views: ['problem'], note: 'Turbine power is not changed with it; raise it in Fluid if needed.' },
  { id: 'pue', label: 'PUE', kind: 'number', min: 1.05, max: 2, step: 0.01, digits: 2, tag: 'A', mode: 'advanced', views: ['problem', ...W] },
  { id: 'rackKW', label: 'Rack power', unit: 'kW', kind: 'number', min: 10, max: 200, step: 5, digits: 0, tag: 'A', mode: 'advanced', views: ['problem'] },
  { id: 'lakeRiseK', label: 'Allowed lake rise', unit: 'K', kind: 'number', min: 1, max: 12, step: 0.5, digits: 1, tag: 'A', mode: 'advanced', views: ['problem', ...W] },
  { id: 'lakeVolM3', label: 'Lake volume (illustrative)', unit: 'M m³', kind: 'number', min: 1e7, max: 5e8, step: 1e6, scale: 1e-6, digits: 0, tag: 'A', mode: 'advanced', views: ['problem'], note: 'Illustrative, not a real site.' },
  { id: 'headM', label: 'Head', unit: 'm', kind: 'number', min: 100, max: 500, step: 10, digits: 0, tag: 'A', mode: 'advanced', views: ['hill', ...W] },
  { id: 'sg', label: 'Fluid density, SG', kind: 'number', min: 1, max: 3.5, step: 0.1, digits: 1, tag: 'A', mode: 'advanced', views: ['hill', ...W] },
  { id: 'recipe', label: 'Fluid recipe', kind: 'choice', choices: [{ value: 'water', label: 'Water' }, { value: 'r19', label: 'R-19' }, { value: 'r39m', label: 'R-39M' }, { value: 'r39f', label: 'R-39F' }, { value: 'r39b', label: 'R-39B' }, { value: 'r39d', label: 'R-39D' }, { value: 'r39r', label: 'R-39R' }], tag: 'A', mode: 'advanced', views: ['hill'], note: 'Sets what the solids are. Density is set separately by SG. All R-39 recipes are hypothetical.' },
  { id: 'millScaleSG', label: 'Mill scale density', kind: 'number', min: 5, max: 5.7, step: 0.1, digits: 1, tag: 'A', mode: 'advanced', views: ['hill'], note: 'Varies with how much of the scale is wüstite, magnetite or hematite.' },
  { id: 'redMudPct', label: 'Red mud share', unit: 'vol%', kind: 'number', min: 1, max: 15, step: 1, digits: 0, tag: 'A', mode: 'advanced', views: ['hill'], when: (p) => p.recipe === 'r39r', note: '2–5 vol% is the R-39R window; 15% was tested on paper and rejected.' },
  { id: 'd50um', label: 'Grind size d50', unit: 'µm', kind: 'number', min: 2, max: 50, step: 1, digits: 0, tag: 'A', mode: 'advanced', views: ['hill'] },
  { id: 'carrierMult', label: 'Carrier viscosity', unit: '× water', kind: 'number', min: 1, max: 50, step: 1, digits: 0, tag: 'E', mode: 'advanced', views: ['hill'], note: 'Thickened water from the additive pack. Estimate.' },
  { id: 'tankHeightM', label: 'Tank fluid height', unit: 'm', kind: 'number', min: 2, max: 30, step: 1, digits: 0, tag: 'A', mode: 'advanced', views: ['hill'] },
  { id: 'sizing', label: 'When head or fluid changes', kind: 'choice', choices: [{ value: 'fixedCapacity', label: 'Keep capacity' }, { value: 'fixedVolume', label: 'Keep volume' }], tag: 'A', mode: 'advanced', views: ['hill'] },
  { id: 'capacityMWh', label: 'Store capacity', unit: 'MWh', kind: 'number', min: 200, max: 4000, step: 0.1, digits: 0, tag: 'SIM', mode: 'advanced', views: ['hill'], when: (p) => p.sizing === 'fixedCapacity' },
  { id: 'volumeM3', label: 'Fluid volume', unit: 'k m³', kind: 'number', min: 1e5, max: 3e6, step: 1e4, scale: 1e-3, digits: 0, tag: 'C', mode: 'advanced', views: ['hill'], when: (p) => p.sizing === 'fixedVolume' },
  { id: 'pumpMaxMW', label: 'Max pump power', unit: 'MW', kind: 'number', min: 50, max: 600, step: 10, digits: 0, tag: 'SIM', mode: 'advanced', views: ['hill', ...W] },
  { id: 'turbineMaxMW', label: 'Max turbine power', unit: 'MW', kind: 'number', min: 25, max: 300, step: 5, digits: 0, tag: 'SIM', mode: 'advanced', views: ['hill', ...W] },
  { id: 'effCase', label: 'Round-trip efficiency', kind: 'choice', choices: [{ value: 'best', label: 'Best 79.3%' }, { value: 'planning', label: 'Planning 70.8%' }, { value: 'measured', label: 'Measured 59%' }, { value: 'custom', label: 'Custom' }], tag: 'A', mode: 'simple', views: ['hill', 'limits', ...W], note: 'Only 59% has ever been measured, on a 500 kW demonstrator.' },
  { id: 'rtCustom', label: 'Custom round trip', unit: '%', kind: 'number', min: 0.3, max: 0.95, step: 0.005, scale: 100, digits: 1, tag: 'A', mode: 'advanced', views: ['hill', 'limits'], when: (p) => p.effCase === 'custom' },
  { id: 'jetCv', label: 'Jet velocity coefficient', kind: 'number', min: 0.9, max: 1, step: 0.01, digits: 2, tag: 'A', mode: 'advanced', views: ['hill'] },
  { id: 'co2CapacityMWh', label: 'CO₂ store size', unit: 'MWh', kind: 'number', min: 200, max: 2000, step: 10, digits: 0, tag: 'A', mode: 'simple', views: ['other'] },
  { id: 'co2PowerMW', label: 'CO₂ turbine power', unit: 'MW', kind: 'number', min: 20, max: 300, step: 5, digits: 0, tag: 'A', mode: 'simple', views: ['other'] },
  { id: 'co2ChargeMW', label: 'CO₂ compressor power', unit: 'MW', kind: 'number', min: 20, max: 600, step: 10, digits: 0, tag: 'A', mode: 'advanced', views: ['other'], note: 'Same as the hill pumps so the comparison is fair.' },
  { id: 'co2RoundTrip', label: 'CO₂ round trip', unit: '%', kind: 'number', min: 0.5, max: 0.9, step: 0.01, scale: 100, digits: 0, tag: 'V', mode: 'advanced', views: ['other'], note: 'Vendor claim. Cost claims disagree.' },
  { id: 'heatDemandMW', label: 'Factory heat demand', unit: 'MW', kind: 'number', min: 1, max: 500, step: 1, digits: 0, tag: 'A', mode: 'simple', views: ['other'], nullable: true, note: 'No factory demand has been sourced. Enter one.' },
  { id: 'heatHours', label: 'Hours without sun', unit: 'h', kind: 'number', min: 1, max: 24, step: 0.5, digits: 1, tag: 'A', mode: 'simple', views: ['other'] },
  { id: 'heatUnitMWh', label: 'Heat unit size', unit: 'MWh', kind: 'number', min: 10, max: 1000, step: 10, digits: 0, tag: 'S', mode: 'advanced', views: ['other'] },
];

export const metaOf = (id: keyof Params) => META.find((m) => m.id === id)!;

export function clampParam(m: Meta, v: unknown): unknown {
  if (m.kind === 'bool') return typeof v === 'boolean' ? v : undefined;
  if (m.kind === 'choice') return m.choices!.some((c) => c.value === v) ? v : undefined;
  if (v === null && m.nullable) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  const s = m.step!;
  const snapped = Math.round((v - m.min!) / s) * s + m.min!;
  // keep exact brief defaults that sit off the step grid (e.g. 1,569.6 MWh)
  const val = Math.abs(v - snapped) < 1e-9 || Number.isInteger(s) === false ? v : snapped;
  return Math.min(m.max!, Math.max(m.min!, val));
}
