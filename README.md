# RescueRelay

RescueRelay is a two-sided coordination demo for a New York City public-data pilot. It turns one declared surplus batch into a deterministic recipient match and a human-approved handoff, backed by live IRS-derived nonprofit records.

**Live demo:** [rescuerelay.onrender.com](https://rescuerelay.onrender.com)

## Current runnable slice

The first implementation slice includes:

- a dummy email entry flow and distinct responsive Donor and Recipient portals;
- live organization and filing data for three NYC nonprofits from ProPublica’s Nonprofit Explorer API;
- the fixed Cedar Events offer and three sourced food-intake policy profiles;
- seven ordered eligibility checks with stable reason codes;
- the complete `prepared → sent → accepted | declined` flow;
- donor send and recipient confirmation as human-only buttons;
- three donor and two recipient WebMCP tool registrations;
- a secondary verification panel showing live API receipt, exact WebMCP role registration, human-only gate exclusion, and the latest real invocation;
- the specified three-table Convex schema, public-profile seed, queries, and atomic mutations;
- an optional Convex realtime frontend adapter selected by `VITE_CONVEX_URL`;
- session-scoped reset and safe latest-tool activity;
- focused eligibility and workflow tests.

With `VITE_CONVEX_URL` set, Convex is the authoritative state and donor/recipient contexts update through one realtime session query. Without it, the app deliberately falls back to a small `localStorage` adapter so the entire flow remains runnable with zero external setup. The header labels which mode is active.

## Run locally

```bash
npm install
npm run dev
```

Open the generated `?session=...` URL, enter any valid email format, and choose a starting workspace. The email flow is intentionally local-only and does not create an account or send mail. Use the role switch to complete both sides of the same NYC pilot session.

## Real-data pilot

The demo requests current organization and filing records for all three recipients from [ProPublica’s Nonprofit Explorer API](https://projects.propublica.org/nonprofits/api/) when the page loads and whenever **Refresh live records** is selected. The returned legal name, address, EIN, 501(c) classification, NTEE code, latest filing year, and latest extracted revenue are visibly marked as live.

These are public records, not partner accounts, and they do not expose live food inventory or intake capacity. The deterministic rules use each organization’s published food-donation guidance for a narrow New York City rehearsal:

| Profile | Public guidance used in the demo | Pilot result for the 7–8 pm offer |
| --- | --- | --- |
| [The Bowery Mission](https://www.bowery.org/donate/donate-goods/) | Fresh, sealed prepared food; daily food drop-off listed for 7–8 pm | Preliminary fit |
| [City Harvest](https://www.cityharvest.org/wp-content/uploads/2023/08/FY24-City-Harvest-Donor-Packet.pdf) | Prepared food from licensed food businesses; pickups generally 9 am–5 pm | Pickup-window mismatch |
| [New York Common Pantry](https://nycommonpantry.org/wp-content/uploads/2025/11/Food-Donation-Q-and-A-updated-October-2025.pdf) | Prepared/perishable food; food-rescue pickups listed 8 am–5 pm | Pickup-window mismatch |

The matcher maps those public notes into a deliberately narrow prepared-meal pilot. Where a page does not state a field explicitly, the UI labels the mapping as a pilot assumption and asks a person to confirm it.

The policy mappings remain sourced and reviewable rather than being presented as real-time availability. A person must still confirm current capacity, food-safety procedures, transport, and acceptance directly. The browser demo never contacts a charity or sends a real reservation.

ProPublica does not currently send browser CORS headers for this endpoint. Local development therefore uses the allowlisted same-origin proxy in `vite.config.ts`. The Render deployment runs the small production server in `server.mjs`, which serves the built app and the same allowlisted `/api/nonprofits` proxy from one origin. A deployed Convex project can still serve the equivalent route from `convex/http.ts`; when `VITE_CONVEX_URL` is present, the frontend automatically derives the matching `.convex.site/api/nonprofits` endpoint. `VITE_LIVE_DATA_PROXY_URL` can override that URL when needed.

For shared realtime mode, initialize Convex, seed the three public profiles, and keep the generated `VITE_CONVEX_URL` in `.env.local`:

```bash
npx convex dev
npx convex run seed:seedPartners
```

## Deploy to Render

Create a Render Blueprint from this repository, or create a Node web service with:

```text
Build command: npm ci && npm run build
Start command: npm start
Health check: /healthz
```

No secrets or environment variables are required for the public demo. `render.yaml` contains the same configuration. The hosted UI uses browser-local session state while the nonprofit identity and filing records are fetched live through the server-side proxy.

## Verify

```bash
npm test
npm run check:convex
npm run build
```

The verification disclosure separates three claims that are easy to confuse:

- **Live-source proof:** all three ProPublica API responses were received and parsed in the current browser session.

- **Registration proof:** the browser exposed WebMCP and every tool for the current role registered successfully (`3/3` donor or `2/2` recipient).
- **Execution proof:** a compatible browser agent actually invoked a page-defined tool. The latest tool name, safe input summary, result, and timestamp appear in the WebMCP checks and Agent activity sections.

The test suite also asserts the exact donor and recipient tool sets, verifies that send/final-confirm actions are absent from WebMCP, and covers unsupported browsers and registration failures.

## Product boundary

RescueRelay records declared handling information. It does not certify food safety, rank human need, guarantee transport, or treat the session URL as authentication. Browser agents may create, check, and prepare; only visible human controls send or finalize a reservation.

## Architecture boundary

The visible UI and all five WebMCP handlers share the same `RescueActions` contract. Convex owns validated, atomic shared transitions when configured; local mode implements the identical contract for quick rehearsal. Live public records travel through an allowlisted server-side proxy, while deterministic food-intake rules remain sourced in the repository. Connect a Convex deployment when shared realtime persistence is needed. The Render demo intentionally keeps workflow state browser-local while serving real nonprofit records through its same-origin production proxy.
