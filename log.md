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
