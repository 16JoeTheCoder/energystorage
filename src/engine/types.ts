export type Cooling = 'land' | 'float' | 'film' | 'spray';
export type EffCase = 'best' | 'planning' | 'measured' | 'custom';
export type Storage = 'hill' | 'co2' | 'heat';
export type Sizing = 'fixedCapacity' | 'fixedVolume';
export type Block = 'brick' | 'graphite' | 'ceramic';

/** Flat on purpose: every field is one row in paramsMeta, one URL key, one undo unit. */
export type Recipe = 'water' | 'r19' | 'r39m' | 'r39f' | 'r39b' | 'r39d' | 'r39r';

export interface Params {
  sunshine: number; arrayMWp: number; cooling: Cooling; tempCoeff: number; cloudCooling: boolean;
  pumpLand: number; pumpFloat: number; pumpFilm: number; pumpSpray: number;
  panelWp: number; mwpPerHa: number;
  loadMW: number; pue: number; rackKW: number; lakeRiseK: number; lakeVolM3: number;
  storage: Storage;
  headM: number; sg: number; recipe: Recipe; millScaleSG: number; redMudPct: number; d50um: number; carrierMult: number; tankHeightM: number; sizing: Sizing; capacityMWh: number; volumeM3: number;
  pumpMaxMW: number; turbineMaxMW: number; turbineUnits: number;
  effCase: EffCase; rtCustom: number; jetCv: number; wearRefHead: number;
  co2CapacityMWh: number; co2PowerMW: number; co2ChargeMW: number; co2RoundTrip: number;
  heatDemandMW: number | null; heatHours: number; heatUnitMWh: number; heatBlock: Block;
}

export interface Totals { solar: number; direct: number; chargeIn: number; toStore: number; delivered: number; fromStore: number; curtailed: number; imported: number; }

export interface DayResult {
  solar: Float64Array; direct: Float64Array; charge: Float64Array; discharge: Float64Array;
  curtailed: Float64Array; imported: Float64Array; store: Float64Array;
  totals: Totals;
  startStore: number; minStore: number; minStoreStep: number; maxStore: number; fullStep: number;
  capacity: number; ec: number; ed: number; iterations: number;
}

export interface StoreSpec { capacity: number; pumpMax: number; turbineMax: number; ec: number; ed: number; }
