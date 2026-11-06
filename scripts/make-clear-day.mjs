// Builds src/data/clearDay.json (96 steps of 15 min).
// If reference/steam_sim_day_data.csv exists, it is used (plan section 4.1).
// Otherwise a calibrated clear day is synthesised from the plan's own numbers:
//   irr(h) = 0.6407 * sin(pi(h-6)/12)^1.3, cell temps hit the brief's noon values
//   (51.9 / 47.8 / 40.9 / 38.2 C) and daily yields (3075.8 / 3106.9 / 3147.0 / 3173.5 MWh).
import fs from 'node:fs';
const ARRAY = 730, TC = 0.003, N = 96;
const pf = (t) => 1 - TC * (t - 25);
const hours = Array.from({ length: N }, (_, i) => i * 0.25);
const out = { source: '', hour: hours, irr: [], tLand: [], tFloat: [], tFilm: [], tSpray: [], ref: { solar_MW: [], store_MWh: [] } };
const csvPath = 'reference/steam_sim_day_data.csv';

if (fs.existsSync(csvPath)) {
  const [head, ...rows] = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',').map((c) => c.trim().toLowerCase());
  const find = (...keys) => cols.findIndex((c) => keys.every((k) => c.includes(k)));
  const ix = { solar: find('solar'), store: find('store'), land: find('land'), float: find('float'), film: find('film'), spray: find('spray') };
  for (const [k, v] of Object.entries(ix)) if (v < 0) throw new Error(`CSV column for "${k}" not found in: ${cols.join(', ')}`);
  rows.slice(0, N).forEach((r) => {
    const c = r.split(',').map(Number);
    out.tLand.push(c[ix.land]); out.tFloat.push(c[ix.float]); out.tFilm.push(c[ix.film]); out.tSpray.push(c[ix.spray]);
    out.irr.push(c[ix.solar] / (ARRAY * pf(c[ix.film])));
    out.ref.solar_MW.push(c[ix.solar]); out.ref.store_MWh.push(c[ix.store]);
  });
  out.source = 'csv';
} else {
  const shape = hours.map((h) => (h > 6 && h < 18 ? Math.sin((Math.PI * (h - 6)) / 12) ** 1.3 : 0));
  const amb = hours.map((h) => 24 + 5 * Math.max(0, Math.sin((Math.PI * (h - 7)) / 14)));
  const noon = { tLand: 51.9, tFloat: 47.8, tFilm: 40.9, tSpray: 38.2 };
  const target = { tLand: 3075.8, tFloat: 3106.9, tFilm: 3147.0, tSpray: 3173.5 };
  const temps = (key, p) => hours.map((h, i) => amb[i] + (noon[key] - amb[48]) * shape[i] ** p);
  const yieldOf = (irr, t) => irr.reduce((s, v, i) => s + ARRAY * v * pf(t[i]) * 0.25, 0);
  // film first: fix p = 1, scale irradiance peak so the film yield is exact
  const tFilm = temps('tFilm', 1);
  const base = shape.map((s) => 0.6407 * s);
  const k = target.tFilm / yieldOf(base, tFilm);
  out.irr = base.map((v) => v * k);
  out.tFilm = tFilm;
  for (const key of ['tLand', 'tFloat', 'tSpray']) {
    let lo = 0.05, hi = 20;
    for (let it = 0; it < 200; it++) {
      const mid = (lo + hi) / 2;
      if (yieldOf(out.irr, temps(key, mid)) < target[key]) lo = mid; else hi = mid;
    }
    out[key] = temps(key, (lo + hi) / 2);
  }
  out.source = 'synthetic';
}
const r = (a) => a.map((v) => Math.round(v * 1e6) / 1e6);
for (const k of ['irr', 'tLand', 'tFloat', 'tFilm', 'tSpray']) out[k] = r(out[k]);
fs.writeFileSync('src/data/clearDay.json', JSON.stringify(out));
console.log('clearDay.json written from', out.source, 'peak irr', Math.max(...out.irr).toFixed(4));
