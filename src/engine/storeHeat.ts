import type { Params } from './types';
export const HEAT_STORAGE_EFF = 0.97;      // [V] heat kept as heat
export const HEAT_TO_ELEC = 1.0 * 0.9 * 0.35; // 0.315 [C]

export function heatReadouts(p: Params) {
  const needed = p.heatDemandMW == null ? null : p.heatDemandMW * p.heatHours;
  return {
    heatNeeded: needed,
    units: needed == null ? null : Math.ceil(needed / p.heatUnitMWh - 1e-9),
    electricityIn: needed == null ? null : needed / HEAT_STORAGE_EFF,
    backToElec: needed == null ? null : needed * HEAT_TO_ELEC,
    heatFor1350: 1350 / HEAT_TO_ELEC,
    unitsFor1350: Math.ceil(1350 / HEAT_TO_ELEC / p.heatUnitMWh - 1e-9),
  };
}
