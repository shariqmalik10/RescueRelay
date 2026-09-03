# Title

RescueRelay

## One-line Summary

RescueRelay lets people and browser agents turn surplus prepared food into a transparent, human-approved charity handoff backed by live nonprofit records.

## Problem

Prepared food has a short window in which it can be safely reused, but donors often have to search across organizations, interpret different intake rules, and repeat the same details over phone calls or messages. Recipient teams then have to reconstruct those facts before they can decide whether a pickup is workable. The result is delay at exactly the moment when delay matters most.

## Solution

RescueRelay is a two-sided coordination workspace for donors and recipient organizations. A donor or browser agent records one structured surplus offer, runs deterministic eligibility checks against three New York City nonprofit profiles, and prepares a reviewable handoff. Live IRS-derived organization and filing records come from ProPublica Nonprofit Explorer, while sourced food-intake guidance explains why each organization is included or excluded.

Agents can prepare work, but they cannot cross the consequential boundaries: only the visible donor control can send the simulated handoff, and only the visible recipient control can confirm the response. The recipient portal receives the same structured facts and can prepare an acceptance or decline before a person confirms it.

## Why This Matters

Food rescue is a coordination problem as much as a logistics problem. RescueRelay shows how WebMCP can remove repetitive data entry and rule checking without hiding decisions or handing final authority to an agent. Donors get a faster, explainable path to a plausible recipient; recipients get clearer facts and retain control over acceptance.

## How We Used AI

RescueRelay does not embed a generative model or pretend that AI can certify food safety. Instead, it exposes five narrow WebMCP tools that a compatible browser agent can use directly:

- `create_surplus_offer`
- `find_eligible_partners`
- `prepare_reservation`
- `get_pending_offer`
- `prepare_response`

Each tool has a strict JSON schema, a bounded purpose, and a user-visible result. Read-only annotations are used where appropriate. Sending the donor handoff and confirming the recipient response are deliberately absent from the agent tool surface.

This makes the application meaningfully better with an agent: the agent can translate a user’s intent into structured fields, check every candidate consistently, and prepare the next safe action without guessing how to click through the interface. The same underlying action contract drives both the human UI and WebMCP handlers.

## How We Used Codex

OpenAI Codex was used as the implementation and review partner throughout the project. It helped ingest the four-page tldraw product plan and written implementation notes, translate them into a small React architecture, implement and refactor the donor and recipient workflows, add the WebMCP registrations, connect the live nonprofit data source, and write the eligibility and state-transition tests.

Codex also drove repeated browser QA at desktop and mobile sizes, checked accessibility and UI polish, verified the exact registered WebMCP tool sets, traced the human-only safety boundaries, added the production Render server, and exercised its health and live-data endpoints before deployment.

## Key Features

- Two focused workspaces with a simple demo email entry and instant donor/recipient switching.
- Five schema-defined WebMCP tools covering structured creation, eligibility checks, preparation, retrieval, and response drafting.
- Human-only donor send and recipient confirmation checkpoints.
- Live legal name, address, EIN, tax classification, filing year, and revenue data from ProPublica’s IRS-derived Nonprofit Explorer API.
- Deterministic, reason-coded matching against published food-intake guidance.
- A visible lifecycle rail that shows which stages belong to people, agents, or deterministic code.
- An expandable verification panel separating live-source proof, tool-registration proof, and real invocation activity.
- Responsive layouts and keyboard-accessible controls.
- Optional Convex adapter for shared realtime persistence; zero-configuration browser-local state for the public demo.

## Architecture

The frontend is React 19, TypeScript, and Vite. Human controls and the five WebMCP handlers share one typed `RescueActions` interface, so agent and UI operations follow the same validation and transitions. The public Render deployment runs a small Node server that serves the built SPA and an allowlisted same-origin `/api/nonprofits` proxy. That proxy fetches current public records for exactly three pilot EINs from ProPublica and avoids exposing a general-purpose server-side fetch surface.

Deterministic food-intake mappings and source links live in the repository. The default demo adapter stores only simulated workflow state in the current browser session. A Convex schema, queries, and atomic mutations are included for an optional shared realtime deployment.

## Testing Instructions

1. Open the public demo URL in ChatGPT’s in-app browser, or in Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Enter any valid email format. No account is created and no email is sent.
3. Choose **I have food to share** and open the donor workspace.
4. Confirm the prefilled 36-meal offer, select **Save offer and continue**, and run **Check compatible recipients**.
5. Verify that The Bowery Mission is the preliminary fit and that City Harvest and New York Common Pantry have explicit rule mismatches.
6. Choose The Bowery Mission, review the handoff, and use the visible **Send simulated handoff** button.
7. Switch to **Recipient**, prepare an acceptance, and confirm it with the visible human control.
8. Expand **Live data and agent verification** to inspect the three live API records and the WebMCP registration/invocation evidence.
9. To test as an agent, ask the in-app browser agent to create the surplus offer, find eligible partners, and prepare the reservation. Then complete the send and final confirmation manually in the page.

Local verification:

```bash
npm install
npm test
npm run check:convex
npm run build
npm start
```

## Public Demo Link

`TODO_RENDER_URL`

## Public Repository Link

`TODO_PUBLIC_REPOSITORY_URL`

## Demo Video

Public YouTube URL: `TODO_YOUTUBE_URL`

Suggested length: 2 minutes 35 seconds.

- **0:00–0:12 — Show the outcome first:** open on the live eligibility result and explain the time-sensitive food-rescue problem.
- **0:12–0:35 — Establish proof:** show three live nonprofit records and the registered WebMCP tools.
- **0:35–1:10 — Agent-assisted donor flow:** ask the browser agent to create the offer, check partners, and prepare the Bowery Mission handoff.
- **1:10–1:32 — Human donor checkpoint:** show that the agent cannot send; review and press the visible simulated-send button.
- **1:32–2:05 — Recipient flow:** switch workspaces, let the agent retrieve the pending offer and prepare acceptance, then confirm manually.
- **2:05–2:25 — Explain the design:** strict schemas, deterministic reasons, live public data, and human-only consequences.
- **2:25–2:35 — Close:** state that WebMCP removes coordination friction while preserving accountability.

Use voiceover or narration throughout. Do not use copyrighted music or third-party trademarks in the recording.

## Screenshot Shot List

1. `artifacts/submission-login.jpg` — product value proposition and simple role entry.
2. `artifacts/submission-donor.jpg` — structured donor offer with three live nonprofit records and 3/3 donor tools.
3. `artifacts/submission-live-match.jpg` — explainable eligibility result with live registry details.
4. `artifacts/submission-human-checkpoint.jpg` — agent-prepared handoff and the donor-only send boundary.
5. `artifacts/submission-recipient.jpg` — recipient review with 2/2 recipient tools.
6. `artifacts/submission-recipient-confirm.jpg` — recipient-only confirmation boundary.

Recommended Devpost gallery set: screenshots 2, 3, 4, 5, and 6.

## Submission Readiness Notes

- Devpost draft project created for The WebMCP Challenge: `https://devpost.com/software/rescuerelay` (status: Draft; not entered for judging).
- Verified locally: 18 automated tests pass, Convex types pass, and the production Vite build succeeds.
- Verified production server: `/healthz` returned 200, the allowlisted `/api/nonprofits` route returned a current ProPublica record, and `/` served the built application.
- Verified in the in-app browser: the live source returned 3/3 records; donor registered 3/3 tools; recipient registered 2/2 tools; the complete simulated donor-to-recipient flow worked.
- Added a root MIT `LICENSE`, a Render Blueprint, public deployment instructions, and six current screenshots.
- Pending: authenticate GitHub, publish the repository, connect Render, verify the public URL and WebMCP tools, record/upload the public YouTube demo, and confirm personal form answers.

## Known Limitations

- The final send and acceptance are intentionally simulated; no charity is contacted.
- Live public records prove organization identity and filings, not current food demand, staff availability, transport, or capacity.
- Food-intake policies are sourced public guidance mapped into a narrow pilot, not live recipient account data.
- Only three New York City organizations are allowlisted for the demo.
- The public demo uses browser-local workflow state, so separate browsers do not share a handoff. The included Convex adapter is the path to shared realtime persistence.
- The email entry is a clearly labeled demo and provides no real authentication.

## TODO Official Form Fields

- **Submitter Type:** `TODO_CONFIRM: Individual / Team of Individuals / Organization`
- **Country of residence of yourself and team members if applicable:** `TODO_CONFIRM_COUNTRY_OR_COUNTRIES`
- **Organization name:** leave blank unless submitting on behalf of an organization.
- **App Status:** `TODO_CONFIRM: New or Existing`
- **If Existing, explain work completed during the submission period:** use the project history and explicitly identify the WebMCP implementation added after August 25, 2026.
- **Live URL:** `TODO_RENDER_URL`
- **Private testing instructions:** use the numbered testing instructions above; no credentials are required.
- **Public code repository:** `TODO_PUBLIC_REPOSITORY_URL`
- **Agent/client used for WebMCP testing:** Codex desktop in-app browser with built-in WebMCP support; reconfirm against the final deployed URL.
- **AI tools leveraged:** OpenAI Codex for implementation, review, testing, and submission drafting. No generative model is embedded in the RescueRelay runtime.
- **Learning derived:** `TODO_CONFIRM: None / Moderate / Significant`
- **AI value usable in career:** `TODO_CONFIRM: Yes / No`
- **Codex session ID:** not requested by the official WebMCP Challenge form.
