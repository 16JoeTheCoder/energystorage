# STEAM simulator: full coding plan

**Project:** "Store the sun for the night" (R-29X hill battery + floating solar + 100 MW data campus). Team: Josef, Oswald, Aaron, Richard.
**Plan date:** 6 Nov 2026. **Status: nothing is built yet. This is a plan only.**
**Reference screens:** attach the artboards "2 Idea: wide view (Simple)" and "3 Fluid: hill battery (Advanced)" from the design file. Their SVG and CSS are also supplied as `reference/wide-view.dc.html` and `reference/hill-view.dc.html`; port that markup into React components instead of redrawing it. The other five screens are specified in words in section 8 and must be restyled to match those two.

Tags used everywhere, same as the research export: **[S]** sourced, **[C]** calculated, **[SIM]** from our brief's simulation, **[V]** vendor claim, **[A]** assumption, **[?]** unverified. New in this plan: **[C*]** means "worked out by checking the brief's own CSV on 6 Nov 2026"; those numbers are test fixtures, not new science.

---

## 0. Read this first (rules for whoever writes the code)

This plan is written for Josef and for the AI coding tool he hands it to (Claude Code or opencode). The rules below override any habit the tool has.

1. **Do not build anything beyond the phase you were told to do.** Each phase in section 11 ends with a stop line. At each stop line, tell Josef what works and wait.
2. **Keep the code lean.** If a feature takes a long time or many tokens and does not clearly improve what the audience sees or learns, skip it and write one line in `decision.md`. Know when to stop.
3. **Two files live at the repo root and are updated every working session.** `decision.md` records what was decided mid-build and why, in plain English, so Josef can read it. `log.md` records what was done, what is next and what is broken, so the AI stays on track. Never skip them.
4. **Every command you tell Josef to run must say where to run it.** In this plan, "VS Code terminal" means Terminal → New Terminal inside VS Code, opened on the repo folder. If he works in WSL, use the Ubuntu/WSL terminal instead; say which.
5. **The engine is the product.** The sketches are pretty, but the numbers must be right. Build and test the engine (phase 1) before drawing a single scene.
6. **Every number on screen is either a user input or a computed value, and every input shows its evidence tag.** Nothing tagged [A], [V] or [?] may be hard-coded as if it were fact; it must come from the parameter table in section 6.
7. **Never present the output as a forecast.** The app models our design under stated assumptions. R-29X is hypothetical; the only measured efficiency is 59% at 500 kW. A small permanent line in the footer says so.

---

## 1. Product definition

**What it is.** A browser app that lets the team and an audience play with the whole system: floating solar makes power by day, a hill battery full of heavy fluid stores it, and turbines return it at night to a 100 MW data campus. Two further chapters show a CO₂-dome battery hooked to the same campus and heat batteries hooked to a factory. The user can change the weather, the array size, the hill height, the fluid, the efficiency and more, and watch the cutaway scene and the numbers respond immediately.

**Who uses it.** Josef presenting to a class and judges (Simple mode, big screen, keyboard shortcuts). Teachers and classmates exploring afterwards (Simple, then Advanced). The team editing assumptions before the diorama is finished.

**Hard constraints.**

- Works with **no internet** on a laptop connected to a projector (fonts included). A single-file build that opens by double-clicking is a required deliverable.
- Runs fast on a school laptop: any input change updates all numbers and the scene within one frame (target under 16 ms of compute).
- 1920×1080 projector first, 1366×768 laptop second. Phone is not a target but must not break (single column, no horizontal scroll).
- No login, no server, no database. All state is in memory, in the URL hash, and in `localStorage`.

**Success looks like this (demo script, section 9):** in five minutes Josef can show the night gap, play a day, shrink the tanks by swapping water for R-29X, drag the sunshine to 25% and see grid import jump, switch to the measured 59% efficiency and see the store fail, and flip to the CO₂ dome and heat battery. The numbers match the brief within the tolerances in section 10.

---

## 2. Design spec (the approved look)

The approved screens are the visual source of truth. The rules below describe them in words so they can be built without guessing.

### 2.1 Tokens (put these in `src/styles/tokens.css` as CSS variables)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#111827` | Text, borders, dark readout bar |
| `--cream` | `#F3EFE6` | Page background |
| `--card` | `#FFFFFF` | Cards |
| `--line` | `#D5CFC0` | Card borders |
| `--muted` | `#4B5563` | Secondary text |
| `--signal` | `#FF5B1F` | Accent: highlight, active tab underline, changed-dot, thick rules |
| `--ink-soft` | `#C9CDD6` | Secondary text on the dark bar |
| `--ink-line` | `#3A4254` | Dividers on the dark bar |
| `--gold` / `--gold-edge` | `#F2C14E` / `#C98F00` | Solar |
| `--store` | `#FF5B1F` | Stored energy (same as signal) |
| Scene colours | see the SVG `<defs>` in the reference files | Sky, rock, earth, water, panel, fluid, slate, cavity |

Colour meaning is fixed across every screen: **gold = solar, orange = stored energy / fluid, ink = campus load, dashed ink = the 100 MW load line, grey-ink wash = night.** Orange is never used for body text.

**Type.** Headings and big numbers: Bricolage Grotesque 800, tight tracking. Body: Instrument Sans 400/600. Nothing under 13 px. Self-host both with `@fontsource/bricolage-grotesque` and `@fontsource/instrument-sans` so the app works offline.

**Shape.** Cards have a 1 px `--line` border and 6 px radius. Chips are pill-shaped, 1.5 px ink border; selected chips are filled ink with cream text. A changed control shows a small orange dot. The page max width is 1360 px, centred.

### 2.2 Layout (every screen)

From top to bottom: top bar (logo mark, title, Undo, Redo, Share scenario, Evidence button, Simple/Advanced segmented control), chapter tabs (1 Problem, 2 Idea, 3 Fluid, 4 Plant, 5 Limits, 6 Other storage; the active tab has a 4 px orange underline), scenario bar (preset chips, "Compare with brief" toggle, Reset all), dark KPI bar (five cells: label, big number, delta text), then the main row: a wide column with the scene card and the timeline card, and a right column ("Adjust", max 420 px) of control cards. Below that, a thin footer rule with a small orange square, the screen name, and the "model of our design, not a forecast" line. The builtbyjosef signature goes in the footer once the logo file exists (placeholder text until then).

### 2.3 Behaviour rules that apply everywhere

- **Simple vs Advanced** changes only which controls and readouts are visible. It never changes the engine or the numbers. In Simple, the Adjust column ends with a dashed card: "Advanced adds N controls: …" (N is computed from the parameter table).
- **Changed-from-brief dot.** A control shows the orange dot whenever its value differs from the brief default. "Brief: 730" under each control resets just that control. "Reset all" resets everything.
- **Compare with brief** (on by default): the KPI bar shows deltas against the brief default ("same as brief", "+196 MWh vs brief"), and charts draw a dashed ghost line of the brief default behind the live line.
- **Undo/redo** covers parameter changes (not the playhead). Commit a history entry when a drag ends or a typed value is confirmed, never on every frame.
- **Everything is keyboard-operable** and has a visible focus ring. Drag handles are also keyboard sliders (section 7).
- **Reduced motion:** respect `prefers-reduced-motion`; animation falls back to the stepped playhead without moving arrows.

---

## 3. Tech stack and project setup

### 3.1 Decisions

| Choice | Pick | Why |
|---|---|---|
| Build tool | Vite | Fast, simple, static output |
| Language | TypeScript (strict) | The engine must not silently produce wrong units |
| UI | React 18 | Josef's AI tools know it best; SVG scenes map cleanly to components |
| State | Zustand | Tiny, no boilerplate, works with undo history |
| Styling | One CSS file with variables | No framework; lean |
| Charts | Hand-written SVG | Only two chart types; no library needed |
| Tests | Vitest | Runs the engine tests in the terminal |
| Routing | None | Chapter and mode live in the store and the URL hash |
| Hosting | Cloudflare Pages (static) | Already his stack; suggested address `steam.josefyang.com` [A] |
| Offline | `vite-plugin-singlefile` | One HTML file that opens from a USB stick or the desktop |

### 3.2 First-time setup (do once)

Check Node first. In the **VS Code terminal** (any folder):

```
node -v
```

It must print v20 or higher. Then create the project. In the **VS Code terminal**, opened in the folder where you keep your projects:

```
npm create vite@latest steam-storage-sim -- --template react-ts
cd steam-storage-sim
npm install
npm install zustand @fontsource/bricolage-grotesque @fontsource/instrument-sans
npm install -D vitest vite-plugin-singlefile
git init
```

Open the new folder in VS Code (File → Open Folder). Create the GitHub repo in the browser at github.com, then, in the **VS Code terminal** in the repo folder, add it as `origin` and push, following the commands GitHub shows. Create `decision.md` and `log.md` at the repo root before the first commit.

Copy the research export, the CSV, and the two reference HTML files into `reference/` and commit them. They are the source of truth.

### 3.3 Folder structure

```
steam-storage-sim/
  decision.md  log.md  README.md
  reference/        research export .md, steam_sim_day_data.csv, wide-view.dc.html, hill-view.dc.html, screenshots
  scripts/          make-clear-day.ts  (CSV -> src/data/clearDay.json, run once)
  src/
    engine/         types.ts constants.ts clearDay.ts solar.ts dispatch.ts
                    storeHill.ts storeCo2.ts storeHeat.ts campus.ts derive.ts index.ts
                    __tests__/  fixtures.ts dispatch.test.ts solar.test.ts storage.test.ts campus.test.ts
    data/           clearDay.json  paramsMeta.ts  presets.ts  evidence.ts
    state/          store.ts  history.ts  urlState.ts  persist.ts
    ui/             Card Chip Segmented Toggle SliderField NumberField Tag Pill
                    TopBar ChapterTabs ScenarioBar KpiBar AdjustPanel Timeline EvidenceDrawer
    scene/          useSceneState.ts  Sky Terrain Handle Pill
                    WideScene HillScene SolarScene CampusScene Co2Scene HeatScene
    views/          ProblemView WideView HillView SolarView LimitsView Co2View HeatView
    styles/         tokens.css  app.css
    App.tsx  main.tsx
  vite.config.ts  (two build modes: normal, and single file)
```

### 3.4 Scripts to add to `package.json`

| Script | Does |
|---|---|
| `npm run dev` | Dev server at localhost:5173 |
| `npm test` | Vitest, engine tests |
| `npm run build` | Normal static build in `dist/` for Cloudflare Pages |
| `npm run build:single` | Same app inlined into `dist-single/index.html` (fonts and data included) |
| `npm run clear-day` | Regenerates `src/data/clearDay.json` from the CSV (only if the CSV changes) |

Where to run each: **VS Code terminal, in the repo root.**

---

## 4. Data layer

### 4.1 The clear-day table (`src/data/clearDay.json`)

Generated once by `scripts/make-clear-day.ts` from `steam_sim_day_data.csv`. It holds 96 steps of 15 minutes and, per step: `hour`, the **irradiance fraction** `irr`, and the cell temperature for each of the four cooling options (`tLand`, `tFloat`, `tFilm`, `tSpray`). It also stores the CSV's own `solar_MW` and `store_MWh` columns under `ref` so tests can compare against them.

**Irradiance fraction [C*].** The CSV's solar column was generated with the *floating + pulsed film* cell temperatures. Check: dividing each solar value by `730 MWp × powerFactor(film cell temperature)` gives a curve that is exactly symmetric about noon (for example 0.4101 at 09:00 and 0.4100 at 15:00). So:

```
irr[i] = solar_MW[i] / (730 × (1 − 0.003 × (tFilm[i] − 25)))
```

The peak is 0.6407 at noon, and the whole curve is within 0.002 of `0.6407 × sin(π(h−6)/12)^1.3` between sunrise (06:00) and sunset (18:00). Ship the 96 values from the script (exact) and keep the formula only as a comment and a test (it proves the curve is a clean clear-day shape and lets us extend to other latitudes later).

**Important:** this means the reference day uses the *film* option. The Solar screen's default cooling is therefore "Floating + film", and the brief default parameter set must say so.

### 4.2 Parameter metadata (`src/data/paramsMeta.ts`)

All controls are generated from this one table. To add a setting later, add one row here and use the value in the engine; the slider, the Advanced list, the evidence tag, the URL encoding and the changed-dot appear automatically. Fields: `id`, `label`, `unit`, `min`, `max`, `step`, `default`, `tag`, `mode` (`simple` or `advanced`), `views` (which chapters show it), `format`, `note`, `evidenceId`.

### 4.3 Evidence registry (`src/data/evidence.ts`)

One entry per fact the app uses: `id`, `label`, `value`, `tag`, `source` (title and URL), `status` (`ok`, `unverified`, `stale`), `checked` (date). The Evidence drawer (top bar button, and clicking any tag badge) lists them grouped by chapter, with filter chips by tag and a banner at the top: "Anything marked A, V or ? is not proven." Seed it from sections 2–5 and 7–8 of the research export. Items to mark `unverified` from day one: Ottana July 2025 start, Antora 5 GWh and "operation by Oct 2026", PepsiCo VOLT opening ("spring 2026"), Argonne TRL 4, Weeze / Tengeh / 1,008 MW hydro, Energy Vault 148 m, Polar Night 100 t / 100–200 kW, Dinorwig round-trip efficiency, and every lithium figure. Items worded "expected by October 2026" or "spring 2026" are already past on 6 Nov 2026: mark them `stale` with the note "re-check".

---

## 5. Engine specification

The engine is plain TypeScript with no React, no DOM and no randomness. Same input, same output, always. All power in MW, energy in MWh, time in hours, step `dt = 0.25 h`, 96 steps per day.

### 5.1 Types (sketch)

```ts
type Cooling = 'land' | 'float' | 'film' | 'spray';
type EffCase = 'best' | 'planning' | 'measured' | 'custom';

interface Params {
  // sun and array
  sunshine: number;        // fraction 0.25..1
  arrayMWp: number;        // 730
  cooling: Cooling;        // 'film'
  tempCoeff: number;       // 0.003 per degC
  cloudCooling: boolean;   // false (see 5.3)
  // campus
  loadMW: number; pue: number; rackKW: number; lakeRiseK: number; lakeVolM3: number;
  // storage (hill)
  headM: number; sg: number; sizing: 'fixedCapacity' | 'fixedVolume';
  capacityMWh: number; volumeM3: number;
  pumpMaxMW: number; turbineMaxMW: number; turbineUnits: number;
  effCase: EffCase; ec: number; ed: number;   // charge-side, discharge-side
  jetCv: number;
  // chapter 6
  co2: { capacityMWh: number; powerMW: number; roundTrip: number };
  heat: { demandMW: number; hours: number; unitMWh: number; block: 'brick'|'graphite'|'ceramic' };
}

interface DayResult {
  solar, direct, charge, discharge, curtailed, imported, store: Float64Array; // 96 each, store is post-step
  totals: { solar, direct, chargeIn, toStore, delivered, curtailed, imported };
  startStore: number; minStore: number; minStoreStep: number; maxStore: number;
}
```

### 5.2 Constants and the brief defaults (`constants.ts`)

| Constant | Value | Tag |
|---|---|---|
| g | 9.81 m/s² | physics |
| Water density | 1,000 kg/m³ | physics |
| Array | 730 MWp | [SIM] |
| Cooling default | `film` | [SIM] [C*] |
| Temperature coefficient | 0.003 per °C (power factor = 1 − 0.003 (T − 25)) | [A] |
| Head | 300 m | [A] |
| Fluid SG | 3.0 | [A] |
| Capacity | 1,569.6 MWh | [SIM] |
| Fluid volume (derived) | 640,000 m³ | [C] |
| Max pump (charge) power | 300 MW | [SIM] |
| Turbines | 4 × 25 MW = 100 MW | [SIM] |
| Campus load | 100 MW | [A] |
| Efficiency, planning | ec 0.8229, ed 0.8601 (round trip 0.708) | [A] |
| Efficiency, best | ec 0.8785, ed 0.9024 (0.793) | [C] |
| Efficiency, measured | ec 0.73, ed 0.80 (0.584, quoted as 59%) | [S] |
| PUE | 1.15 | [A] |
| Rack power | 100 kW | [A] |
| Allowed lake rise | 6 K | [A] |
| Water specific heat | 4,186 J/kg·K | physics |
| Jet velocity coefficient | 0.97 (gives 74.4 m/s at 300 m) | [A] [SIM ?] |
| Wear reference head | 150 m | [A] |
| Panel size / density | 700 Wp, 0.83 MWp/ha | [A] / [C] |

### 5.3 Solar and cell temperature (`solar.ts`)

```
powerFactor(T)     = 1 − tempCoeff × (T − 25)
solarMW(i)         = arrayMWp × irr[i] × sunshine × powerFactor(Tcell(i))
Tcell(i)           = clearDay.t[cooling][i]                       // default
```

With `cloudCooling` on, scale the rise above ambient by `sunshine`: `T = Tamb + (Tref − Tamb) × sunshine`, with `Tamb` taken from the night values and linearly interpolated across daylight. **Default is off, and that is deliberate:** the brief's cloud numbers match plain scaling more closely than any ambient model I tried (section 10). Keep the toggle in Advanced as a labelled extra, not the default.

**Pump energy per cooling option [C*, back-solved].** The brief reports net daily gains vs land of +1.0%, +2.0%, +0.13% for floating, film, spray. At 730 MWp, the gross gains are +1.01%, +2.32%, +3.18%. The difference is the pump energy the brief subtracted: **0.4, 9.7 and 93.7 MWh per day**. Store these as parameters `coolingPumpMWh` (tag [C*], note "back-solved from the brief's net gains; replace with real pump specs"). Net yield = gross − pump energy.

Daily gross yield at 730 MWp, clear day [C*]: land 3,075.8, floating 3,106.9, film 3,147.0, spray 3,173.5 MWh.

The CSV's cell-temperature columns for film and spray switch between "active" and "passive" values at fixed times (for example, film is active 09:30–14:30). Treat them as model output with a schedule; show them as drawn, with a small note "spray schedule switches here".

### 5.4 Dispatch (`dispatch.ts`) — verified against the CSV

Order of priority each step: solar to the load first, surplus to the store, deficit from the store, then grid import, curtail what cannot be stored.

```
for each step i:
  s     = solarMW(i)
  direct = min(s, loadMW)
  surplus = s − direct
  need    = loadMW − direct
  if surplus > 0:
      room   = (capacity − store) / dt / ec            // MW the store can still accept
      charge = max(0, min(pumpMaxMW, surplus, room))
      store += charge × dt × ec
      curtailed = surplus − charge
      discharge = 0
  else:
      avail     = store × ed / dt                      // MW the store can still give
      discharge = min(need, turbineMaxMW, avail)
      store    -= discharge × dt / ed
      curtailed = 0
  imported = need − discharge                          // zero when surplus > 0
  record post-step store
```

**Start-of-day store (steady state).** Do not hard-code a start. Run the same day repeatedly, feeding each day's final store into the next, until start and end differ by less than 0.01 MWh (cap at 200 iterations). With brief defaults this converges to **808.0 MWh**. The CSV's `store_MWh` column is the store *after* each step, so its first row (778.9 at 00:00) is 808.0 minus one 100 MW discharge step; the research export's note about "small drift" was this, not an error.

**Why steady state:** "a cloudy day" means a day that repeats, not a single bad day after a full store (a single cloudy day after a full store imports nothing at 70%). This is also how the brief's cloud numbers behave.

**Multi-day mode** (phase 7, optional): `simulateMulti(params, sunPerDay[])` starts from the steady state of the first day and chains days. Use it for a "cloudy week" chart. Not needed for the first presentation.

### 5.5 Hill physics (`storeHill.ts`)

```
energyPerM3_kWh  = ρ g h / 3.6e6, ρ = 1000 × SG
                 = 0.8175 × SG × (h / 300)                   // 2.4525 at brief defaults
capacityMWh      = volumeM3 × energyPerM3_kWh / 1000
volumeM3         = capacityMWh × 1000 / energyPerM3_kWh      // 640,000 at brief defaults
pressureMPa      = ρ g h / 1e6                               // 8.83
jetIdeal_m_s     = sqrt(2 g h) (76.7 at 300 m); jet = jetCv × jetIdeal   // 74.4
wearVsRef        = (h / wearRefHead)^1.5                    // 2.83 at 300 m vs 150 m  [rule of thumb, unmeasured]
deliveredPerFull = capacityMWh × ed                         // 1,350 MWh at brief defaults
hoursAtLoad      = deliveredPerFull / loadMW                // 13.5
```

Note for the explanation text: jet speed depends on the drop only, not on the fluid. Energy per m³ and pressure scale with the fluid's density. That is why a denser fluid gives a smaller tank and the same wear.

**Sizing decision (log it in `decision.md`).** `sizing` defaults to `fixedCapacity`: changing head or fluid changes the *fluid volume* needed (this matches how the brief and slides present "smaller tank"). A toggle in Advanced switches to `fixedVolume`, where changing head or SG changes the *capacity* and the dispatch changes with it. This makes the "200 m fallback" preset honest in both ways: with fixed capacity you need 960,000 m³; with fixed volume the store falls to 1,046 MWh and the night fails (fixtures in section 10).

### 5.6 Efficiency (`derive.ts`)

`effCase` sets `ec` and `ed` from the constants table. `custom` takes a round-trip target `RT` from the slider and sets `ec = ed = √RT`. Display round trip as `ec × ed` (planning 70.8%, best 79.3%, measured 58.4% shown as "59% measured").

### 5.7 Campus and lake (`campus.ts`)

```
itMW      = loadMW / pue                                   // 87 MW
racks     = itMW / (rackKW / 1000)                         // 870
flow_m3_s = loadMW × 1e6 / (1000 × 4186 × lakeRiseK)       // 3.98 at 100 MW, 6 K
flow_m3_day = flow × 86400                                 // 344,000
lakeWarming_K_day = loadMW × 1e6 × 86400 / (4.186e6 × lakeVolM3)   // 0.03 for the illustrative 6.9e7 m3 lake
```

The lake volume is an **illustrative input**, not a site [A]. Say so next to it.

### 5.8 CO₂ dome (`storeCo2.ts`) [V]

Uses the same dispatch interface with its own parameters: `capacityMWh` (default 1,350 as sized for our night), `powerMW` (default = load), `roundTrip` 0.75 [V] with `ec = ed = √0.75 = 0.866` [A]. Readouts: duration `capacityMWh / powerMW`; energy in per night `delivered / roundTrip` (1,800 MWh for 1,350); CO₂ mass `capacityMWh × 1000 / 100` tonnes at 100 kWh per tonne [C] (13,500 t); scale vs the largest operating plant `capacityMWh / 200` (6.75×; Ottana 20 MW / 200 MWh [S]); and a risk list (asphyxiation, dome height, scale) as static text. When the CO₂ dome is the selected storage, the wide view and all KPIs run through the same dispatch with these parameters; the hill-only readouts (head, fluid, wear) are hidden.

### 5.9 Heat battery and factory (`storeHeat.ts`)

A separate, simpler model because heat serves a *factory's* heat demand, not the campus's electricity.

```
heatNeededMWh   = demandMW × hours
unitsNeeded     = ceil(heatNeededMWh / unitMWh)                 // default unit 100 MWh
electricityIn   = heatNeededMWh / storageEff                    // storageEff 0.97  [V] (heat kept as heat)
backToElecMWh   = heatMWh × 0.315                               // 1.00 x 0.90 x 0.35  [C]; show range 25–55% [A]
unitsToReplace1350 = 1350 / 0.315 / unitMWh                     // 4,286 MWh, ~43 units [C]
```

The factory demand input is **blank by default** with the placeholder "e.g. 20" and an [A] tag; no factory demand has been sourced. Outputs show "enter a demand" until it is filled. Three block cards (brick, graphite, ceramic) show their real-plant facts from the evidence registry; only the brick card (Rondo, 100 MWh, >1,000 °C) is sourced strongly, the other two carry [?] where the export says so. The key message stays: use heat batteries for process heat, not for the data centre's overnight electricity.

### 5.10 Derived KPIs (`derive.ts`)

Per run: grid import per day, delivered from store per day, curtailed per day, store now (at playhead), night covered (%) = `1 − import / (loadMW × 13.5)` clipped to 0–100 [A: night defined as the 13.5 h the brief uses], campus served from sun directly, and the energy balance check (section 10).

---

## 6. State, scenarios and sharing

### 6.1 Store shape (Zustand)

`params` (all of section 5.1), `ui` (`chapter`, `mode`, `compare`, `evidenceOpen`), `clock` (`hour` 0–24, `playing`, `speed` 1/4/16), `history` (past and future arrays of param snapshots, max 100). Derived values (`result`, `baselineResult`) are computed with a memo keyed on `JSON.stringify(params)`; the baseline is the brief default and is computed once.

### 6.2 Changed-from-brief logic

`isChanged(id) = params[id] !== BRIEF[id]` (deep equal for nested). Drives the orange dot, the "Brief: X" reset link, and the URL encoding.

### 6.3 Presets (`presets.ts`) — exact definitions

| Chip | Parameter changes | What the audience should see |
|---|---|---|
| Brief default | none | The reference day |
| Hazy / Cloudy / Storm (sunshine chips) | sunshine = 0.7 / 0.4 / 0.25 | Imports about 542 / 1,241 / 1,620 MWh |
| Cloudy week | sunshine = 0.4 (steady) in v1; real 7-day profile in phase 7 | Import about 1,241 MWh per day |
| Measured 59% | effCase = measured | Import about 174 MWh/day, curtailed drops |
| 200 m fallback | headM = 200 | Fluid volume 960,000 m³ (fixed capacity) |
| Double array | arrayMWp = 1,460 | Curtailed about 3,366 MWh/day: more panels do not help once the store is full |
| Water instead | sg = 1.0 | Volume 1.92 M m³ |
| Real R-19 | sg = 2.5 | Volume 768,000 m³ |

### 6.4 URL sharing

`#v1=` followed by base64url JSON of only the parameters that differ from the brief, plus chapter and mode. On load, validate every field against its `min`/`max`/`step`, drop unknown keys, clamp out-of-range values, and fall back to the brief if parsing fails. "Share scenario" copies the full URL. Saved scenarios (name + params) go in `localStorage` under `steam-sim-scenarios-v1`, with try/catch around every access.

---

## 7. Scene rendering and interaction

### 7.1 Approach

Each scene is a React component rendering one SVG (the reference files contain the artwork). A `useSceneState()` hook reads the engine result at the playhead and returns plain values; scene components only map values to attributes. No scene component calls the engine itself.

### 7.2 Bindings (wide view; the hill view reuses the hill parts)

| Visual | Bound to |
|---|---|
| Sun position | Point on the quadratic arc `M60 330 Q500 −150 940 330` at `t = (hour − 6) / 12`; hidden at night, moon shown instead |
| Sky gradient | Interpolated between four keyframes: night (00:00–05:00), dawn (06:00), day (09:00–15:00), dusk (18:00), night (20:00–24:00) |
| Panel brightness | `irr × sunshine` (opacity of the highlight lines) |
| Upper tank fluid | `store / capacity` |
| Lower cavern fluid | `1 − store / capacity` (volume is conserved) |
| Shaft arrows | Up when charging, down when discharging, hidden when idle; shaft fluid opacity rises with flow |
| Pump cable (orange) | Animated dashes when `charge > 0`; label text shows `charge` MW |
| Sun-to-campus cable (gold) | Animated dashes when `direct > 0`; label shows `direct` MW |
| Turbine cable | Dashed and faint when idle; animated when `discharge > 0` |
| Curtailment pill | Appears when `curtailed > 0`: "Curtailing X MW" |
| Grid import pill | Appears when `imported > 0` in orange: "Grid import X MW" |
| Campus windows | Always lit; slightly brighter at night |
| Head label and dimension line | `headM`; the hill top moves with head (scale the hill's height between 100 and 500 m, keep the base fixed) |
| Panel count and lake edge | `arrayMWp` (number of visible panel rows scales with MWp; edge handle moves) |

### 7.3 Playback

The day result is precomputed (96 steps). A `requestAnimationFrame` loop advances `clock.hour` by `speed × (elapsed seconds) × (24 h / 60 s)` at 1× (one full day per minute at 1×; 4× = 15 s per day; 16× = about 4 s), wraps at 24, and pauses when the tab is hidden. Scene values come from linear interpolation between steps. Dragging the sun or the playhead sets `hour` directly and pauses playback.

### 7.4 Drag handles

Built once as a `Handle` component using pointer events (`setPointerCapture`) and also exposed as `role="slider"` with `aria-valuemin/max/now`, focusable, with arrow keys (step) and Shift+arrow (10× step). Three handles: **sun** (drag along the arc → `hour`), **hill top** (vertical drag → `headM`, snap to 10 m, 100–500), **lake edge** (horizontal drag → `arrayMWp`, snap to 10, 200–2,200). While dragging, show a small value pill next to the handle. Each handle writes to the same store field as its slider, so the two always agree.

### 7.5 Charts

`Timeline` is hand-written SVG. X axis 24 h across 920 units; solar as a filled gold area, store as an orange line on the right axis (0–capacity), load as a dashed ink line, night as a faint ink wash (before 06:00 and after 18:00), a draggable playhead, and the ghost line of the brief when Compare is on. Hover shows a tooltip with the step's values. Both axes are labelled with units; the scale changes only when capacity or array size changes.

### 7.6 Accessibility checklist

Real `<button>`, `<input>`, `<label>` everywhere. The KPI bar and "right now" values sit in an `aria-live="polite"` region updated at most twice per second. Charts have `role="img"` and an `aria-label` summarising the numbers. Colour never carries meaning alone (every colour-coded series also differs by line style or label). Contrast 4.5:1 for text.

---

## 8. Screen-by-screen spec

Each screen lists: scene, controls (Simple / Advanced), KPI cells, extra readouts, special interactions. Control ranges are in `paramsMeta.ts`; the numbers below are the defaults.

### 8.1 Chapter 1 — Problem (data campus)

**Scene:** campus cutaway (sawtooth-roof data hall with racks, lake-water intake, chillers, 150 kV transformer yard). **Chart:** the "same power at 3 a.m. as at noon" chart: solar curve against the flat load line, night gap hatched in orange. **Simple:** Play, time scrubber, campus load slider (100 MW). **Advanced:** PUE 1.15, rack power, racks (870, computed), lake rise 6 K, flow 3.98 m³/s (344,000 m³/day), lake volume (illustrative) with warming in K/day. **KPI cells:** load, solar covers (10.5 h), store must cover (13.5 h), the night gap `load × 13.5 = 1,350 MWh` highlighted, flow. **Limitation card:** "The 100 MW size is our assumption. No real site, lake or discharge permit has been modelled."

### 8.2 Chapter 2 — Idea (wide view) — **reference screen, attached**

Build exactly as the reference. Scene bindings in 7.2. Simple controls: sunshine (with Clear / Hazy 70 / Cloudy 40 / Storm 25 chips), solar array with "880 ha · about 1.04 M panels" helper text, storage type chips (Hill battery / CO₂ dome / Heat + factory; the last two switch the scene's storage building and open chapter 6). KPI cells: grid import, delivered from store, curtailed, store right now, night covered. The Advanced hint card lists the extra controls. **Hotspots:** clicking the lake, the hill, or the campus in the scene jumps to chapter 4, 3 or 1 respectively (and a "Zoom to" row of chips does the same); the CO₂ dome and heat buildings appear dashed and faint until selected.

### 8.3 Chapter 3 — Fluid (hill battery, Advanced) — **reference screen, attached**

Build exactly as the reference, including the Pelton wheel inset and the three fluid cards. Fluid cards are buttons that set `sg` (1.0, 2.5, 3.0); the mini tank pictogram height equals `volume / waterVolume` (1.00, 0.40, 0.33). The right column holds head (with 200 fallback chip), fluid density, pump and turbine power, efficiency chips with tags, and the limitation card. KPI cells: energy per m³, pressure at the foot, fluid volume, full store, turbine wear. The tanks show the real fill level; the caverns the complement. Clicking "Pelton wheel" opens a one-paragraph explainer (why wear grows with jet speed cubed, flagged as a rule of thumb).

### 8.4 Chapter 4 — Plant (floating solar)

**Scene:** lake with rows of floating panels, shore cable, sun overhead; panel colour intensity follows `irr × sunshine`; optional spray droplets drawn only when the spray or film schedule is active. **Simple:** cooling chips (Land / Floating / Floating + film / Floating + spray), sunshine slider, array slider. **Advanced:** panel size (700 Wp), temperature coefficient (0.3%/°C), density (0.83 MWp/ha), `cloudCooling` toggle, per-option pump energy. **Charts:** noon cell temperature bars for the four options (51.9 / 47.8 / 40.9 / 38.2 °C), and "grid import on a cloudy day" bars for 100 / 70 / 50 / 25% sun, computed live by running the steady-state engine four times (about 0, 542, 1,004, 1,620 MWh). **KPI cells:** net gain vs land for the selected option, daily solar yield, power factor at noon, cell temperature at noon, grid import. **Limitation:** "The day shape is a clear day scaled, not real weather."

### 8.5 Chapter 5 — Limits (efficiency)

Efficiency chips (Best / Planning / Measured) drive the engine; the screen shows **engine results, not simple multiplication**. Chart: "Energy in needed for one 1,350 MWh night" and "delivered from the store vs grid import" per case. A second block lists "what has to be true" (fluid stays mixed, pumps and turbines survive, efficiency climbs from 59%, a site exists) and the scale gap (1,376× fluid, 200× power vs the Cornwood demonstrator, [C]).

**Correction to the sketch.** The approved Limits sketch shows "1,112 MWh delivered, short by 238", which was simple multiplication (1,885 × 0.59) from the export. The real dispatch with measured efficiency gives **delivered from store 1,160.8 MWh and grid import 173.6 MWh per day** (because the store also curtails less). The built screen must show the engine's numbers and the sketch must be updated.

### 8.6 Chapter 6a — CO₂ dome

Scene: gas dome, two liquid-CO₂ tanks, heater and turbine, campus; the dome inflates when the store is empty and deflates when full; liquid tanks fill the other way. Controls: store size (200–2,000 MWh, default 1,350), power, round trip (75% [V]) with a note that cost claims disagree. KPI cells: lasts (h), energy in per night, CO₂ needed (t), vs largest plant (×), and a risk card. Uses the same dispatch with the CO₂ parameters, so the Timeline works unchanged.

### 8.7 Chapter 6b — Heat batteries to a factory

Scene as sketched (sun → brick block → steam/oil → factory). Inputs: factory demand (blank, placeholder), hours without sun (13.5), block chips with real-plant fact cards. Outputs per 5.9. A fixed key-idea card: heat is cheap to keep but loses most of its value turning back into power, so it feeds the factory directly.

### 8.8 Shared: Evidence drawer, Compare tab, Presenter mode

**Evidence drawer** (section 4.3). **Compare storage** (a tab inside chapter 6): a table of hill 70.8% [A] / 59% [S], CO₂ 75% [V], gravity tower >80% [V], heat as heat >97% [V], heat to electricity 31.5% [C], with the standing note "efficiency numbers are NOT directly comparable". **Presenter mode** is section 9.

---

## 9. Presenter mode and the demo script

**Presenter mode** (key `P`, or button): hides the top-bar buttons and the scenario bar's reset link, increases base font size by 12%, makes the KPI bar the largest element, and shows a tiny chapter number in the corner. Shortcuts: `1`–`6` chapters, `Space` play/pause, `←`/`→` move time by 1 h, `S` Simple/Advanced, `C` compare on/off, `R` reset all, `E` evidence, `Esc` leaves presenter mode.

**Five-minute script (matches the slide sections).**

1. **Problem (slides 1.1–1.3).** Chapter 1. Scrub to 03:00: the load is 100 MW and the solar is 0. Point at the 1,350 MWh gap.
2. **Idea (2.1–2.4).** Chapter 2. Press Play at 4×: store fills from 18 MWh at 07:00 to full at 15:30, then drains. Drag the sun to noon to show 445 MW of sun, 300 MW going to the pumps, 100 MW straight to the campus.
3. **Fluid (3.1–3.4).** Chapter 3. Click Water, then R-19, then R-29X: the tank pictogram shrinks (1.92 M → 0.77 M → 0.64 M m³). Drag the head from 300 to 150 m and read the wear drop from 2.83× to 1×.
4. **Plant (4.x).** Chapter 4. Click Land, then Floating + film: cell temperature 51.9 → 40.9 °C at noon. Drag sunshine to 25%: grid import jumps to about 1,620 MWh/day.
5. **Limits (5.x).** Chapter 5. Click Measured 59%: grid import about 174 MWh/day appears. "Only this efficiency has been measured." Finish on the "what has to be true" block. Chapter 6 only if asked.

Rehearse with the single-file build on the actual presentation laptop and keep the Cloudflare link as the backup.

---

## 10. Testing and validation

### 10.1 What is already verified (6 Nov 2026, [C*])

I replayed the dispatch in 5.4 against `steam_sim_day_data.csv` using the brief defaults. Starting from the steady-state store of 808.0 MWh, the store trace matches the CSV's `store_MWh` column at every one of the 96 steps with a maximum difference of **0.12 MWh**. Totals match the research export's reference: solar 3,147.0; peak 445.4 MW at 12:00; direct to load 1,065.5; energy into the pumps 1,885.4; delivered from store 1,334.5; curtailed 196.1; import 0; minimum store 18.1 MWh at 07:00; store reaches 1,569.6 at 15:30.

### 10.2 Golden fixtures (`engine/__tests__/fixtures.ts`)

| Test | Params | Expected | Tolerance |
|---|---|---|---|
| Brief day, totals | defaults | solar 3,147.0; direct 1,065.5; chargeIn 1,885.4; delivered 1,334.5; curtailed 196.1; import 0 | ±0.5 |
| Brief day, store trace | defaults | equals CSV `store_MWh` at all 96 steps | ±0.2 |
| Steady-state start | defaults | 808.0 MWh | ±0.1 |
| Min store | defaults | 18.1 MWh at step 28 (07:00) | ±0.2 |
| Cloud 70% | sunshine 0.7 | import 542 (brief says 537) | ±1% of brief or ±6 |
| Cloud 50% | sunshine 0.5 | import 1,004 (brief 1,001) | same |
| Cloud 40% | sunshine 0.4 | import 1,241 (brief 1,238) | same |
| Cloud 25% | sunshine 0.25 | import 1,620 (brief 1,618) | same |
| Cooling yields | defaults, each option | land 3,075.8; floating 3,106.9; film 3,147.0; spray 3,173.5 | ±0.5 |
| Net gains | with pump energy 0.4 / 9.7 / 93.7 | +1.0%, +2.0%, +0.13% vs land | ±0.05 pt |
| Measured 59% | ec 0.73, ed 0.80 | import 173.6; delivered 1,160.8; curtailed 93.8; start store 632.2 | ±1 |
| Array 500 MWp | arrayMWp 500 | import 576.9 | ±1 |
| Array 1,000 MWp | 1,000 | import 0; curtailed 1,372 | ±2 |
| Double array | 1,460 | import 0; curtailed 3,366 | ±5 |
| Load 150 MW, turbines 150 | loadMW 150 | import 928.1 | ±1 |
| 200 m, fixed volume | headM 200, sizing fixedVolume | capacity 1,046.4; import 434.4; curtailed 809.9 | ±1 |
| 200 m, fixed capacity | headM 200, fixedCapacity | volume 960,000 m³; same dispatch as brief | exact |
| Water / R-19 volumes | sg 1.0 / 2.5 | 1,920,000 / 768,000 m³ | ±100 |
| Hill physics | defaults | 2.4525 kWh/m³; 8.83 MPa; jet 74.4 m/s; wear 2.83; 13.5 h | ±0.01 |
| Campus | defaults | 87 MW IT; 870 racks; 3.98 m³/s; 344,000 m³/day | ±0.5% |
| CO₂ | defaults | 6.75× the largest plant; 13,500 t; energy in 1,800 MWh | ±1 |
| Heat | 1,350 MWh at 31.5% | 4,286 MWh heat, 43 units of 100 MWh | ±1 |

The "measured 59%" and "double array" rows are my own outputs from the verified rules, not figures from the brief; treat them as regression tests, not as truth.

### 10.3 Property tests (must always pass)

For every run and every parameter combination in a small grid: `solar = direct + chargeIn + curtailed` (energy in); `Δstore over the day = chargeIn × ec − delivered / ed` (≈ 0 in steady state); `0 ≤ store ≤ capacity` at every step; `charge ≤ pumpMax`, `discharge ≤ turbineMax`; `served = direct + delivered + imported = load × 24` at every load that is met; no negative numbers; no NaN or Infinity (clamp inputs to their metadata ranges).

### 10.4 UI checks

Manual checklist per phase (section 11): every control changes the right number; Undo/Redo restores; Reset all returns to the brief; the URL round-trips; handle drag equals slider drag; the single-file build opens by double-click with the network turned off (fonts render); presenter shortcuts work; keyboard-only run of the demo script succeeds; 1366×768 and 1920×1080 both fit without scrolling the scene.

### 10.5 Definition of done for the whole app

Section 10.2 passes; section 10.3 passes; the demo script runs end to end on the presentation laptop offline; `decision.md` and `log.md` are current; the evidence drawer shows every tag used on screen.

---

## 11. Phased build plan (with stop lines)

Phases are ordered so that a presentable app exists as early as possible. Estimates are in AI-assisted working time, not calendar promises.

| Phase | Work | Output | Stop line (tell Josef, wait) |
|---|---|---|---|
| 0 | Setup (3.2), `decision.md`, `log.md`, copy `reference/` | Empty app runs at localhost:5173 | `npm run dev` works; repo pushed |
| 1 | Engine (section 5) + fixtures (10.2, 10.3) | `npm test` all green | All golden and property tests pass |
| 2 | Data: `clearDay.json` script, `paramsMeta`, `presets`, `evidence` seed | Data files, URL encode/decode, history | Round-trip of a scenario via URL works in a test |
| 3 | UI kit and shell: tokens, TopBar, ChapterTabs, ScenarioBar, KpiBar, AdjustPanel, SliderField, Timeline | Shell with live numbers, no scene yet | KPIs and chart change with sliders |
| 4 | **Chapter 2 wide view** (reference screen 2): scene, handles, playback | The main demo screen | Demo script beats 2 works |
| 5 | **Chapter 3 hill view** (reference screen 3) | Fluid cards, wear, Pelton inset | Demo script beat 3 works |
| **MVP line** | Phases 0–5 | Presentable app if time is short | Build the single file and test offline |
| 6 | Chapters 1, 4, 5 | Problem, Plant, Limits screens | Demo beats 1, 4, 5 work |
| 7 | Chapter 6 (CO₂, heat), Compare tab, Evidence drawer polish, multi-day "cloudy week" | Full app | Everything in section 8 present |
| 8 | Presenter mode, keyboard shortcuts, accessibility pass, `build:single` | Offline file | Section 10.4 checklist passes |
| 9 | Deploy to Cloudflare Pages, domain, signature mark | Public link | Link opens on a phone |

**Deploy (phase 9).** In the browser at dash.cloudflare.com: Workers & Pages → Create → Pages → connect the GitHub repo; build command `npm run build`, output directory `dist`. Add the custom domain from the same page. No environment variables needed.

**If time is tight today:** do phases 0–5 only, run `npm run build:single`, and present from that one file. Chapters 1, 4, 5 and 6 appear as the existing static sketches. Do not start phase 6 until the MVP line has been tested offline on the presentation laptop.

---

## 12. Risks and decisions to make

**Biggest risk: scope against the clock.** The sketches are ambitious; seven screens plus engine plus offline build is a lot. The MVP line exists for this reason. Cut chapters, never the engine tests.

**Accuracy risks.**

1. The cloud numbers differ from the brief by 0.2–0.9% (542 vs 537, 1,004 vs 1,001, 1,241 vs 1,238, 1,620 vs 1,618). I could not find the brief's exact rule; plain scaling is the closest of the variants I tested, and every cell-temperature variant moved further away (521–525 at 70%). Decision: accept ±1% and state it, or re-extract the brief's code (the export itself recommends this).
2. The reference day is a clear-day shape scaled, not weather. A real irradiance dataset (PVGIS or NASA POWER for a real site) is the upgrade (backlog).
3. R-29X, the 70.8% efficiency and the 300 m head are design assumptions. The audience must always be able to see that: tags on controls, the footer line, the limitation cards.
4. The per-cooling pump energies (0.4 / 9.7 / 93.7 MWh/day) are back-solved from the brief, not specified pumps. Keep them editable and labelled.
5. Several research facts are unverified or stale (section 4.3). They must not appear in Simple mode as facts.

**Decisions to log in `decision.md` at the start** (my recommendation first):

| Decision | Recommended | Alternative |
|---|---|---|
| Sizing mode default | Fixed capacity (volume changes) | Fixed volume (capacity changes) |
| Cloud model | Plain scaling, steady state | Cell-temperature-aware (off by default) |
| Cooling default | Floating + film (matches the CSV) | Land |
| Night definition for "night covered" | 13.5 h (brief) | Sun below horizon |
| Cloudy week in v1 | Steady cloudy day (sunshine 0.4) | Real 7-day profile (phase 7) |
| Host | Cloudflare Pages + single-file backup | Single file only |

---

## 13. Backlog (expand later, in this order)

1. **Real weather and site.** Hourly irradiance and temperature from PVGIS or NASA POWER for a chosen location; a site selector; seasonal view.
2. **Cloudy week and multi-day charts.** Store level across seven days with a profile editor.
3. **Cost and payback.** Capex per kWh from the Cornwood cost model ($266 / $144 / $113 per kWh at 150 / 250 / 300 m head [V]); simple levelised cost for each storage type; lithium as a placeholder the user fills in.
4. **Better physics.** Part-load pump and turbine efficiency, head loss, ramp rates, fluid mixing energy, settling (syneresis) with a time-to-mix penalty, pump wear over time.
5. **Lake thermal model.** Evaporation, mixing and outfall plume; discharge-permit check against the 6 K limit.
6. **Scenario compare view.** Two saved scenarios side by side, with a diff table.
7. **PDF brief export.** One page of the current scenario with its tags, linking to the renewable-showcase project.
8. **Tilted pseudo-3D view** of the hill (layered parallax) as a stretch; a full 3D model only if the team wants it after everything else.
9. **Indonesian text** for parents and the school, and a mobile layout.
10. **Gravity tower and lithium models** as additional storage types using the same dispatch interface.

Adding any of these should mean adding rows to `paramsMeta.ts`, an engine function, and one view; the structure in section 3.3 is built for that.

---

## 14. How to start (for Josef)

1. Say "build phase 0" to your coding tool in a new session started in the repo folder, with this file and the reference screens attached. (Per your own rule, nothing is built until you say so.)
2. After each phase, read the new lines in `decision.md` and `log.md` before saying "build the next phase".
3. Before presenting, run the section 10.4 checklist on the actual laptop with Wi-Fi off.

*Sources for every number: `reference/steam_simulation_research_export.md` (section 8 lists the URLs) and the CSV. Tags marked [C*] come from the checks run on 6 Nov 2026 and are reproduced by the tests in section 10.*
