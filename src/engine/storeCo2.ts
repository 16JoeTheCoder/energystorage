import type { Params } from './types';
export const CO2_KWH_PER_T = 100;
export const LARGEST_CO2_PLANT_MWH = 200; // Ottana 20 MW / 200 MWh [S]

export function co2Readouts(p: Params) {
  const e = Math.sqrt(p.co2RoundTrip);
  return {
    ec: e, ed: e,
    hours: p.co2CapacityMWh / p.co2PowerMW,
    energyInPerNight: p.co2CapacityMWh / p.co2RoundTrip,
    co2Tonnes: (p.co2CapacityMWh * 1000) / CO2_KWH_PER_T,
    vsLargest: p.co2CapacityMWh / LARGEST_CO2_PLANT_MWH,
  };
}
