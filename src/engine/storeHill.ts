import { G, RHO_WATER } from './constants';
import type { Params } from './types';

export const energyPerM3kWh = (headM: number, sg: number) => (RHO_WATER * sg * G * headM) / 3.6e6;
export const pressureMPa = (headM: number, sg: number) => (RHO_WATER * sg * G * headM) / 1e6;
export const jetIdeal = (headM: number) => Math.sqrt(2 * G * headM);

export function hillCapacity(p: Params) {
  return p.sizing === 'fixedCapacity' ? p.capacityMWh : (p.volumeM3 * energyPerM3kWh(p.headM, p.sg)) / 1000;
}
export function hillVolume(p: Params) {
  return p.sizing === 'fixedCapacity' ? (p.capacityMWh * 1000) / energyPerM3kWh(p.headM, p.sg) : p.volumeM3;
}

export function hillPhysics(p: Params, ed: number) {
  const capacity = hillCapacity(p);
  const delivered = capacity * ed;
  return {
    energyPerM3: energyPerM3kWh(p.headM, p.sg),
    pressure: pressureMPa(p.headM, p.sg),
    atm: pressureMPa(p.headM, p.sg) / 0.101325,
    volume: hillVolume(p),
    waterVolume: (capacity * 1000) / energyPerM3kWh(p.headM, 1),
    capacity,
    jetIdeal: jetIdeal(p.headM),
    jet: p.jetCv * jetIdeal(p.headM),
    wear: (p.headM / p.wearRefHead) ** 1.5,
    deliveredPerFull: delivered,
    hoursAtLoad: delivered / p.loadMW,
  };
}
