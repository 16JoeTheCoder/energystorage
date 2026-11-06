# log.md — what was done, what is next, what is broken

## 6 Nov 2026
**Done**
- Phase 0: Vite + React 18 + TS strict + Zustand + Vitest + vite-plugin-singlefile. Fonts self-hosted (@fontsource, latin subset).
- Phase 1: engine (`src/engine/`), 251 tests green: golden fixtures (plan 10.2), property grid of 216 runs (10.3), URL round-trip, history.
- Phase 2: `clearDay.json` (synthetic, see decision 2), `paramsMeta.ts`, `presets.ts`, `evidence.ts`, URL `#v1=` encoding with clamping, undo/redo.
- Phase 3–5: shell (top bar, tabs, scenarios, KPI bar, Adjust panel generated from paramsMeta, Timeline with ghost line and draggable playhead), wide view and hill view ported from the reference SVGs with live bindings and drag handles.
- Phase 6–7: Problem, Plant, Limits, Other storage (CO₂ dome, heat + factory, compare table), Evidence drawer.
- Phase 8: presenter mode (P), shortcuts 1–6 / Space / ←→ / S / C / R / E / Esc / Ctrl+Z, reduced motion, `npm run build:single`.

**Next**
- Put the real CSV in `reference/` and run `npm run clear-day && npm test`.
- Rehearse the demo script on the presentation laptop with Wi-Fi off.
- Phase 9: deploy (README).

**Broken / known gaps**
- "Measured 59%" is 3–5 MWh off the plan's numbers until the real CSV is used.
- No saved-scenarios UI yet; no 7-day cloudy-week chart.
- Fixed after QA: chapter 6 Heat tab now shows its own inputs; invalid typed numbers revert.

## 6 Nov 2026 (session 2) — R-39 fluid
**Done**
- New fluid model `src/engine/fluid.ts`: how much solid is in the fluid, how thick it is, what it costs, how fast it settles, how hard it pushes on the tank floor, and how much mill scale it would eat. 20 new tests; all 251 old tests still pass unchanged.
- Fluid chapter: four cards (Water, R-19, R-39M, R-39F), a "fluid facts" box with a bar comparing the fluid bill to a lithium battery, new Advanced controls, and the wear explainer now says iron oxide is harder than barite.
- Footer, sliders note, scene label, presets (R-39M, R-39F, 15% red mud rejected), evidence list (R-29X entry replaced by 13 R-39 entries, including why R-29X was dropped).
**Next**
- Add `reference/r39-handoff.md` to the repo and fill in the exact source URLs in `src/data/evidence.ts`.
**Broken / known gaps**
- Viscosity and settling are estimates, not measurements. Plant cost beyond the fluid is not modelled.
