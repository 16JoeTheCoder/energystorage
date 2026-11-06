/** Fluid model for the R-39 family (pure, no React). All outputs are modelled, nothing measured. */
import type { Params, Recipe } from './types';

const G = 9.81;
export interface Solid { name: string; sg: number; price: number; grind: number; freight: number; }
/** $/t prices: [S] sourced; grinding, freight [A]. Barite price taken as delivered (freight 0) [A]. */
export const SOLIDS = {
  millScale: { name: 'mill scale', sg: 5.2, price: 78, grind: 15, freight: 15 },
  hematite: { name: 'hematite', sg: 5.0, price: 97.5, grind: 15, freight: 15 },
  magnetite: { name: 'magnetite', sg: 5.2, price: 126, grind: 15, freight: 15 },
  barite: { name: 'barite', sg: 4.2, price: 193.5, grind: 15, freight: 0 },
  redMud: { name: 'red mud', sg: 3.0, price: 3, grind: 0, freight: 40 },
} satisfies Record<string, Solid>;
export const BARITE_RANGE = [171, 216];
export const ADDITIVES = { r39: 18, r19: 9.5 }; // $/m³ [A]
export const LITHIUM = { perKWh: 108, billUSD: 146e6, mwh: 1350 };
export const INDONESIA_SCALE_KT = [190, 570]; // 19.0 Mt crude steel × 1–3 %
export const MU_WATER = 0.85; // mPa·s base in Krieger–Dougherty

export interface RecipeDef { id: Recipe; name: string; sgNominal: number; mix: [keyof typeof SOLIDS, number][]; phim: number; redMud?: boolean; additives: number; note: string; }
export const RECIPES: Record<Recipe, RecipeDef> = {
  water: { id: 'water', name: 'Water', sgNominal: 1, mix: [], phim: 0.64, additives: 0, note: 'No solids.' },
  r19: { id: 'r19', name: 'R-19', sgNominal: 2.5, mix: [['barite', 1]], phim: 0.64, additives: ADDITIVES.r19, note: 'Real fluid. Recipe inferred from a pending patent and public statements.' },
  r39m: { id: 'r39m', name: 'R-39M', sgNominal: 3, mix: [['millScale', 1]], phim: 0.64, additives: ADDITIVES.r39, note: 'Mill scale. Pilot / diorama fluid.' },
  r39f: { id: 'r39f', name: 'R-39F', sgNominal: 3, mix: [['hematite', 1]], phim: 0.64, additives: ADDITIVES.r39, note: 'Hematite fines. Plant-scale fluid.' },
  r39b: { id: 'r39b', name: 'R-39B', sgNominal: 3, mix: [['millScale', 0.5], ['hematite', 0.5]], phim: 0.64, additives: ADDITIVES.r39, note: '50:50 blend by solids volume.' },
  r39d: { id: 'r39d', name: 'R-39D', sgNominal: 3, mix: [['millScale', 1]], phim: 0.74, additives: ADDITIVES.r39, note: 'Two-size grind packs tighter (φm 0.74).' },
  r39r: { id: 'r39r', name: 'R-39R', sgNominal: 3, mix: [['millScale', 1]], phim: 0.64, redMud: true, additives: ADDITIVES.r39, note: 'Mill scale plus a little red mud.' },
};

export interface FluidIn { recipe: Recipe; sg: number; millScaleSG: number; redMudPct: number; d50um: number; carrierMult: number; tankHeightM: number; headM: number; ed: number; volumeM3: number; }
export const fluidIn = (p: Params, ed: number, volumeM3: number): FluidIn => ({ recipe: p.recipe, sg: p.sg, millScaleSG: p.millScaleSG, redMudPct: p.redMudPct, d50um: p.d50um, carrierMult: p.carrierMult, tankHeightM: p.tankHeightM, headM: p.headM, ed, volumeM3 });

/** Solids volume fraction from fluid SG and solid SG. */
export const solidsVol = (sg: number, solidSG: number) => Math.max(0, (sg - 1) / (solidSG - 1));
export const solidsWt = (phi: number, solidSG: number, sg: number) => (phi * solidSG) / sg;
/** Krieger–Dougherty, intrinsic factor 2.5 × 1.2 = 3.0. Estimate. */
export const kdViscosity = (phi: number, phim: number) => (phi >= phim ? Infinity : MU_WATER * (1 - phi / phim) ** (-3.0 * phim));
export const redMudPhim = (xf: number) => 0.64 + 0.08 * Math.max(0, 1 - Math.abs(xf - 0.25) / 0.25);
/** Hindered settling, m/s. */
export const settling = (deltaRho: number, dM: number, muCarrierPaS: number, phi: number) => ((deltaRho * G * dM * dM) / (18 * muCarrierPaS)) * (1 - phi) ** 4.65;

export interface Part { solid: Solid; phi: number; }
export interface FluidFacts {
  parts: Part[]; phi: number; wt: number; phim: number; relLoading: number; viscosity: number;
  costM3: number; perTonne: number; perKWh: number; bill: number; billVsLithium: number;
  settlingCmDay: number; stabilityKPa: number; millScaleT: number; years: [number, number] | null;
}

export function fluidFacts(f: FluidIn): FluidFacts {
  const def = RECIPES[f.recipe];
  const solidOf = (k: keyof typeof SOLIDS): Solid => (k === 'millScale' ? { ...SOLIDS.millScale, sg: f.millScaleSG } : SOLIDS[k]);
  const parts: Part[] = [];
  let mass = f.sg - 1; // excess mass to supply (t/m³ above water)
  if (def.redMud) { const rm = f.redMudPct / 100; parts.push({ solid: SOLIDS.redMud, phi: rm }); mass -= rm * (SOLIDS.redMud.sg - 1); }
  if (def.mix.length) {
    const avgSG = def.mix.reduce((a, [k, s]) => a + s * solidOf(k).sg, 0);
    const phiMain = Math.max(0, mass / (avgSG - 1));
    for (const [k, s] of def.mix) parts.push({ solid: solidOf(k), phi: phiMain * s });
  }
  const phi = parts.reduce((a, x) => a + x.phi, 0);
  const solidMass = parts.reduce((a, x) => a + x.phi * x.solid.sg, 0);
  const wt = f.sg > 0 ? solidMass / f.sg : 0;
  const phim = def.redMud && phi > 0 ? redMudPhim(parts[0].phi / phi) : def.phim;
  const viscosity = phi > 0 ? kdViscosity(phi, phim) : MU_WATER;
  const costM3 = parts.reduce((a, x) => a + x.phi * x.solid.sg * (x.solid.price + x.solid.grind + x.solid.freight), 0) + (phi > 0 ? def.additives : 0);
  const perTonne = costM3 / f.sg;
  const perKWh = perTonne / (0.002725 * f.headM * f.ed);
  const bill = f.volumeM3 * costM3;
  const solidSG = phi > 0 ? solidMass / phi : 1;
  const v = phi > 0 ? settling((solidSG - 1) * 1000, f.d50um * 1e-6, 1e-3 * f.carrierMult, phi) : 0;
  const ms = parts.filter((x) => x.solid.name === 'mill scale').reduce((a, x) => a + x.phi * x.solid.sg, 0);
  const millScaleT = ms * 1000 * f.volumeM3 / 1000; // phi × SG × 1000 kg/m³ × volume → t
  return {
    parts, phi, wt, phim, relLoading: phi / phim, viscosity, costM3, perTonne, perKWh, bill, billVsLithium: bill / LITHIUM.billUSD,
    settlingCmDay: v * 86400 * 100, stabilityKPa: (f.sg - 1) * G * f.tankHeightM,
    millScaleT, years: millScaleT > 0 ? [millScaleT / (INDONESIA_SCALE_KT[1] * 1000), millScaleT / (INDONESIA_SCALE_KT[0] * 1000)] : null,
  };
}
