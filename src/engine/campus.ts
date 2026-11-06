import { CP_WATER, RHO_WATER } from './constants';
import type { Params } from './types';

export function campus(p: Params) {
  const itMW = p.loadMW / p.pue;
  const flow = (p.loadMW * 1e6) / (RHO_WATER * CP_WATER * p.lakeRiseK);
  return {
    itMW,
    racks: itMW / (p.rackKW / 1000),
    flow,
    flowDay: flow * 86400,
    lakeWarmingKday: (p.loadMW * 1e6 * 86400) / (RHO_WATER * CP_WATER * p.lakeVolM3),
  };
}
