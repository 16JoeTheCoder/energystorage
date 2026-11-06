import type { Tag } from './paramsMeta';

export interface Evidence { id: string; chapter: string; label: string; value: string; tag: Tag; source?: { title: string; url?: string }; status: 'ok' | 'unverified' | 'stale'; checked: string; note?: string; }
const D = '2026-11-06';
const brief = { title: 'Team brief and simulation (reference/steam_simulation_research_export.md)' };
export const EVIDENCE: Evidence[] = [
  { id: 'load', chapter: '1 Problem', label: 'Data campus load', value: '100 MW, flat, 24 h', tag: 'A', status: 'ok', checked: D, source: brief },
  { id: 'pue', chapter: '1 Problem', label: 'PUE', value: '1.15', tag: 'A', status: 'ok', checked: D, source: brief },
  { id: 'rack', chapter: '1 Problem', label: 'Rack power', value: '100 kW', tag: 'A', status: 'ok', checked: D, source: brief },
  { id: 'lake', chapter: '1 Problem', label: 'Allowed lake rise / lake volume', value: '6 K / 6.9 × 10⁷ m³ (illustrative)', tag: 'A', status: 'ok', checked: D, note: 'No real site, lake or discharge permit modelled.' },
  { id: 'array', chapter: '2 Idea', label: 'Floating solar array', value: '730 MWp', tag: 'SIM', status: 'ok', checked: D, source: brief },
  { id: 'clearday', chapter: '2 Idea', label: 'Clear-day irradiance shape', value: '0.6407 × sin(π(h−6)/12)^1.3', tag: 'C*', status: 'ok', checked: D, note: 'Reconstructed from the plan; regenerate from the CSV with npm run clear-day.' },
  { id: 'head', chapter: '3 Fluid', label: 'Head', value: '300 m', tag: 'A', status: 'ok', checked: D, source: brief },
  { id: 'r29x', chapter: '3 Fluid', label: 'R-29X fluid, SG 3.0', value: 'Hypothetical recipe', tag: 'A', status: 'ok', checked: D },
  { id: 'r19', chapter: '3 Fluid', label: 'RheEnergise R-19, SG 2.5', value: '2.5× water density', tag: 'S', status: 'ok', checked: D, source: { title: 'RheEnergise', url: 'https://www.rheenergise.com' } },
  { id: 'cornwood', chapter: '3 Fluid', label: 'Cornwood demonstrator', value: '500 kW, 59% round trip measured', tag: 'S', status: 'ok', checked: D, source: { title: 'RheEnergise Cornwood demonstrator', url: 'https://www.rheenergise.com' } },
  { id: 'wear', chapter: '3 Fluid', label: 'Turbine wear ∝ head^1.5', value: 'Rule of thumb, reference 150 m', tag: 'A', status: 'unverified', checked: D },
  { id: 'jet', chapter: '3 Fluid', label: 'Jet velocity coefficient', value: '0.97', tag: 'A', status: 'unverified', checked: D },
  { id: 'energyvault', chapter: '3 Fluid', label: 'Energy Vault tower height', value: '148 m', tag: '?', status: 'unverified', checked: D },
  { id: 'dinorwig', chapter: '3 Fluid', label: 'Dinorwig round-trip efficiency', value: '~75%', tag: '?', status: 'unverified', checked: D },
  { id: 'tempcoeff', chapter: '4 Plant', label: 'Temperature coefficient', value: '0.3% per °C', tag: 'A', status: 'ok', checked: D },
  { id: 'pumps', chapter: '4 Plant', label: 'Cooling pump energy', value: '0.4 / 9.7 / 93.7 MWh/day', tag: 'C*', status: 'ok', checked: D, note: 'Back-solved from the brief’s net gains; replace with real pump specs.' },
  { id: 'hydro', chapter: '4 Plant', label: 'Weeze / Tengeh / 1,008 MW hydro floating PV', value: 'Reference projects', tag: '?', status: 'unverified', checked: D },
  { id: 'eff', chapter: '5 Limits', label: 'Planning round trip', value: '70.8% (0.8229 × 0.8601)', tag: 'A', status: 'ok', checked: D },
  { id: 'effbest', chapter: '5 Limits', label: 'Best-case round trip', value: '79.3%', tag: 'C', status: 'ok', checked: D },
  { id: 'scale', chapter: '5 Limits', label: 'Scale gap vs Cornwood', value: '1,376× fluid, 200× power', tag: 'C', status: 'ok', checked: D },
  { id: 'ottana', chapter: '6 Other storage', label: 'Ottana CO₂ battery', value: '20 MW / 200 MWh, start July 2025', tag: 'S', status: 'unverified', checked: D, source: { title: 'Energy Dome', url: 'https://energydome.com' } },
  { id: 'co2rt', chapter: '6 Other storage', label: 'CO₂ dome round trip', value: '75%', tag: 'V', status: 'ok', checked: D },
  { id: 'rondo', chapter: '6 Other storage', label: 'Rondo brick heat battery', value: '100 MWh, >1,000 °C', tag: 'S', status: 'ok', checked: D, source: { title: 'Rondo Energy', url: 'https://rondo.com' } },
  { id: 'antora', chapter: '6 Other storage', label: 'Antora graphite', value: '5 GWh, operation by Oct 2026', tag: '?', status: 'stale', checked: D, note: 're-check' },
  { id: 'pepsico', chapter: '6 Other storage', label: 'PepsiCo VOLT opening', value: 'spring 2026', tag: '?', status: 'stale', checked: D, note: 're-check' },
  { id: 'argonne', chapter: '6 Other storage', label: 'Argonne ceramic, TRL 4', value: 'TRL 4', tag: '?', status: 'unverified', checked: D },
  { id: 'polar', chapter: '6 Other storage', label: 'Polar Night sand battery', value: '100 t / 100–200 kW', tag: '?', status: 'unverified', checked: D },
  { id: 'heatrt', chapter: '6 Other storage', label: 'Heat back to electricity', value: '31.5% (1.00 × 0.90 × 0.35), range 25–55%', tag: 'C', status: 'ok', checked: D },
  { id: 'gravity', chapter: '6 Other storage', label: 'Gravity tower round trip', value: '>80%', tag: 'V', status: 'ok', checked: D },
  { id: 'lithium', chapter: '6 Other storage', label: 'Lithium-ion figures', value: 'All', tag: '?', status: 'unverified', checked: D },
];
