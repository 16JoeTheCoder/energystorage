export const fmt = (n: number, d = 0) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–';
export const pct = (f: number, d = 0) => fmt(f * 100, d) + '%';
export const hhmm = (h: number) => {
  const m = Math.round((((h % 24) + 24) % 24) * 60) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/** "same as brief" / "+196 MWh vs brief" */
export function delta(cur: number, base: number, unit: string, d = 0, eps?: number) {
  const diff = cur - base;
  const e = eps ?? 0.5 * 10 ** -d;
  if (Math.abs(diff) < e) return 'same as brief';
  return `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff), d)}${unit ? ' ' + unit : ''} vs brief`;
}
