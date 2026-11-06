# Store the sun for the night · Simulator

Browser simulator for the STEAM project: floating solar → R-39 hill battery (hypothetical iron-oxide fluid, SG 3.0) → 100 MW data campus, plus a CO₂ dome and heat-battery chapter. Plan: `reference/STEAM_Simulator_Coding_Plan.md`. Decisions: `decision.md`. Progress: `log.md`.

It models our design under stated assumptions. It is not a forecast.

## Run it (VS Code terminal, in the repo root)

```bash
npm install
```

```bash
npm run dev
```

Opens at http://localhost:5173.

| Command | Does |
|---|---|
| `npm test` | Engine, URL and history tests (Vitest) |
| `npm run build` | Static site in `dist/` (Cloudflare) |
| `npm run build:single` | One offline file: `dist-single/index.html` (double-click to open, no internet needed) |
| `npm run clear-day` | Rebuilds `src/data/clearDay.json` (from `reference/steam_sim_day_data.csv` if present) |

Node 20 or newer.

## Shortcuts
`1`–`6` chapters · `Space` play/pause · `←`/`→` ±1 h · `S` Simple/Advanced · `C` compare · `R` reset all · `E` evidence · `P` presenter mode · `Esc` leave · `Ctrl+Z` / `Ctrl+Shift+Z` undo/redo.

## Deploy on Cloudflare

**Option A — Pages (recommended).** dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable (only if the build complains about Node): `NODE_VERSION` = `20`
- Save and Deploy. Custom domain: the project's **Custom domains** tab → add `steam.josefyang.com` (the DNS record is added for you if the domain is on Cloudflare).

**Option B — Worker with static assets.** In the VS Code terminal in the repo root:

```bash
npm run build
```

```bash
npx wrangler deploy
```

Uses `wrangler.jsonc` (serves `dist/`). The first run asks you to log in in the browser.

**Backup:** copy `dist-single/index.html` to a USB stick. It works with Wi-Fi off.

## Fluid: R-39 (replaced R-29X, Nov 2026)

The fluid is now the hypothetical **R-39 family**: finely ground iron oxide in water with an R-19-style additive pack (R-39M mill scale for a pilot, R-39F hematite for plant scale, plus R-39B blend, R-39D two-size grind, R-39R with 2–5 vol% red mud). SG stays 3.0, so every energy and dispatch number is unchanged. The fluid model lives in `src/engine/fluid.ts` (solids loading, Krieger–Dougherty viscosity, cost, settling, tank load, mill scale supply) with tests in `src/engine/__tests__/fluid.test.ts`. Nothing about R-39 has been measured.
