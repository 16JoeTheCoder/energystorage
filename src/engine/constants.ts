export const G = 9.81;
export const RHO_WATER = 1000;
export const CP_WATER = 4186;
export const DT = 0.25;
export const STEPS = 96;
export const NIGHT_HOURS = 13.5;

export const EFF = {
  best: { ec: 0.8785, ed: 0.9024 },
  planning: { ec: 0.8229, ed: 0.8601 },
  measured: { ec: 0.73, ed: 0.8 },
} as const;
