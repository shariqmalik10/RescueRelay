# RescueRelay — Product and Technical Specification

Status: Approved hackathon MVP specification  
Updated: 29 August 2026  
Hosting: Render Static Site  
Backend: Convex  

## 1. Purpose and Source of Truth

This document consolidates the RescueRelay decisions made during ideation, WebMCP research, scope review, and implementation planning. It is the canonical specification for the hackathon build and supersedes broader earlier drafts.

The goal is one polished, repeatable public-benefit demonstration—not a production food-rescue marketplace. If a proposed feature is not in this document, it is deferred unless it replaces work of comparable size.

### Current implementation pilot (3 September 2026)

The runnable build uses a New York City public-data pilot in place of fictional recipient fixtures. The three records are The Bowery Mission, City Harvest, and New York Common Pantry. Registered organization and filing fields are fetched live by EIN from ProPublica’s IRS-derived Nonprofit Explorer API through an allowlisted server proxy. Their published donation guidance provides source material for a narrow pilot mapping of category, packaging, storage, and pickup-window checks. The fixed pilot offer is 36 sealed, chilled vegetarian meals with dairy information, available from **7:00–8:00 PM**. The Bowery Mission is the one preliminary fit; the other two profiles are excluded for pickup-window mismatch.

The registry fields are live public data; the food-intake rule mappings are sourced policy facts, not a live availability or capacity feed and not a claim of partnership. Capacity is intentionally optional and displayed as a human confirmation when a public profile does not publish it. The UI and WebMCP actions simulate sending and responding; they never contact a charity. Where the original planning notes below say “fictional,” this pilot addendum governs the current implementation.

## 2. Executive Summary

RescueRelay is a coordination application for rehearsing a food-rescue handoff with a small New York City public-data pilot. A donor records a batch of packaged surplus meals, RescueRelay applies deterministic recipient rules, and the donor prepares a reservation for a profile that appears compatible. The recipient can then prepare an acceptance or decline response. People on both sides make the final commitments in the visible interface.

The RescueRelay website exposes its own first-party WebMCP tools. It does not need an existing WebMCP-enabled marketplace or Shopify storefront. A browser agent can turn natural-language requests into structured actions such as creating an offer, checking eligibility, or preparing a response. The same application actions power the visible UI, so the agent and the person see one shared source of truth.

The product is deliberately narrow:

- One web page with Donor and Recipient modes
- One fixed meal-rescue scenario
- Three sourced NYC public-profile recipient records (not partner-confirmed)
- Seven deterministic eligibility checks
- Five WebMCP tools
- Three Convex tables
- Two visible human-confirmation gates
- One complete end-to-end test and a two-minute demo

## 3. What the Application Does

RescueRelay helps a donor and recipient answer four time-sensitive questions:

1. What surplus food is available?
2. Which public profile appears compatible under its published rules?
3. What exactly is being proposed?
4. Have people on both sides explicitly agreed?

The application does not certify food safety, decide who is most deserving, create trust between unknown organizations, arrange transportation, or contact the profiled organizations. It uses public guidance for a deterministic rehearsal; a real handoff would require direct partner confirmation.

### Product promise

> Describe the surplus. RescueRelay finds a compatible recipient, explains every match and exclusion, and prepares the handoff while people retain authority over commitments.

## 4. How WebMCP Is Involved

WebMCP lets the RescueRelay page describe structured tools to a compatible browser agent. Instead of visually guessing which form fields and buttons matter, the agent receives named tools with schemas and clear outputs.

Example interaction:

> “We have 36 sealed, chilled vegetarian meals with dairy labels, available from 7:00 to 8:00. Find someone who can accept them.”

The agent can then:

1. Call `create_surplus_offer` with structured meal facts.
2. Call `find_eligible_partners` to receive deterministic matches and exclusions.
3. Call `prepare_reservation` for the selected eligible partner.
4. Stop at the visible donor confirmation boundary.

After the donor sends the reservation, the recipient’s agent can:

1. Call `get_pending_offer`.
2. Call `prepare_response` with `accept` or `decline`.
3. Stop at the visible recipient confirmation boundary.

### Important WebMCP boundaries

- RescueRelay exposes tools from its own site; existing WebMCP sites are not required.
- WebMCP is an interface, not the database or synchronization layer.
- Convex owns the authoritative shared state.
- The UI and tool handlers call the same application actions.
- Eligibility is ordinary deterministic code, not an AI judgment.
- The donor’s final send and recipient’s final response are not registered as tools.
- A browser without WebMCP can still use the complete visible interface.
- RescueRelay does not need to call an OpenAI model from its backend; the browser agent supplies the natural-language intelligence.

## 5. Product Decision History

### Concepts considered

- **RescueRelay:** first-party WebMCP coordination for surplus-food rescue.
- **ReliefCart:** a caseworker-oriented essentials planner using live Shopify WebMCP storefront tools.

RescueRelay was selected because it offers a stronger original public-benefit story, complete control over demo data, a clear two-sided human-agent experience, and less dependency on third-party storefront availability. ReliefCart remains a possible future or bonus concept, not part of the RescueRelay critical path.

### Technology decisions

| Decision | Chosen approach | Reason |
|---|---|---|
| Frontend hosting | Render Static Site | Confirmed hosting choice for the Vite build |
| Shared backend | Convex | Combines data, server functions, atomic mutations, and realtime subscriptions |
| Database-only alternatives | Deferred | Postgres, MySQL, Neon, or similar would still need an API and realtime layer |
| Supabase | Valid fallback, not selected | SQL, row-level security, migrations, and realtime configuration add hackathon work |
| Application shape | One page | Removes routing and repeated screen state |
| Final commitments | Human-only UI actions | Gives judges and users an obvious authority boundary |

Render credits and sponsor-reward administration are project logistics, not application requirements, and are therefore outside this specification.

## 6. Problem, Users, and Public Benefit

### Problem statement

Usable surplus food is often lost because donor and recipient coordinators must compare packaging, allergen information, storage capability, pickup hours, and capacity through calls, messages, and spreadsheets. The coordination delay can consume the food’s usable window.

### Primary users

- **Donor coordinator:** works at an event venue, cafeteria, restaurant, or similar organization and needs to offer surplus quickly.
- **Recipient coordinator:** works at a food bank, shelter, pantry, or community organization and needs accurate handling and timing information before agreeing.
- **Browser agent:** translates a person’s request into the page’s structured WebMCP tools and explains results.

Drivers, beneficiaries, public shoppers, and organization administrators are not MVP users.

### Public-benefit value

- Reduces repetitive coordination during a short pickup window
- Makes recipient constraints explicit instead of relying on guesswork
- Shows why a partner matched or failed
- Preserves human authority over organizational commitments
- Avoids collecting beneficiary identities or other unnecessary personal information

## 7. Fixed Demonstration Scenario

### Donor offer

- Donor: Cedar Events
- Meal category: vegetarian prepared meals
- Quantity: 36
- Packaging: sealed
- Allergen information: present
- Allergens: dairy
- Storage: chilled
- Pickup window: 7:00–8:00 PM
- Handling declaration: acknowledged

### Seeded public-profile records

The pilot records and public guidance are fixed for the demo. The rule outcomes remain deterministic:

| Recipient profile | Public guidance used by the matcher | Expected result |
|---|---|---|
| The Bowery Mission | Fresh, sealed prepared food; daily food drop-off listed for 7:00–8:00 PM | Preliminary fit |
| City Harvest | Prepared food from licensed food businesses; pickups generally 9:00 AM–5:00 PM | Excluded with `PICKUP_WINDOW_MISMATCH` |
| New York Common Pantry | Prepared/perishable food; food-rescue pickups listed 8:00 AM–5:00 PM | Excluded with `PICKUP_WINDOW_MISMATCH` |

All other rules pass for the two exclusions so each demonstrates one clear, sourced reason. None of the three public profiles publishes a live capacity used by this pilot.

### Demonstration acceptance result

- Exactly one eligible recipient
- Exactly two excluded recipients
- Each exclusion has a stable reason code and plain-language explanation
- The selected recipient receives the sent reservation without refreshing
- Accepted or declined state appears in both role views

## 8. Product Epics and Acceptance Criteria

### E1 — Session and role workspace

The page creates or restores a generated `?session=...` URL and provides a Donor/Recipient role switch.

Acceptance:

- Two browser contexts opened with the same session URL see the same data.
- Different session URLs do not see or reset each other’s operational data.
- Switching roles unregisters the previous WebMCP tool set before registering the new set.
- Unsupported browsers show a WebMCP status message but retain complete UI functionality.

### E2 — Offer creation and deterministic matching

The donor can create the fixed offer through the form or WebMCP and view eligibility results.

Acceptance:

- The session has at most one offer.
- Server validation is authoritative.
- Matching produces one preliminary fit and two excluded public profiles.
- No LLM can override a failed eligibility rule.

### E3 — Reservation preparation and donor confirmation

The donor or agent prepares an exact reservation summary for an eligible recipient.

Acceptance:

- Preparation does not send anything to the recipient.
- The offer has at most one reservation.
- Eligibility is rerun on the server before preparation and send.
- Only the visible **Send reservation** action can change `prepared` to `sent`.

### E4 — Recipient response and realtime result

The recipient sees the sent reservation, prepares accept or decline, and confirms it visibly.

Acceptance:

- Only a sent reservation can receive a response draft.
- Preparing a response does not finalize it.
- Only the visible recipient confirmation changes the state to `accepted` or `declined`.
- The donor sees the terminal state reactively.

### E5 — WebMCP transparency and safety

The page registers the correct tools and displays a compact activity record.

Acceptance:

- Exactly three donor tools or two recipient tools are registered for the selected role.
- Final commitment actions are absent from the registry.
- The evidence rail separately reports API detection, exact role registration, human-only gate exclusion, and the latest observed agent invocation.
- Unsupported browsers and registration failures never display a verified/live state.
- Tool inputs use strict schemas.
- Tool errors expose no stack traces, secrets, or unnecessary personal data.
- The latest safe tool activity is visible in the page.

### E6 — Repeatable public demonstration

The project deploys publicly and can return to the fixed initial state.

Acceptance:

- Reset deletes operational records only for the current session URL.
- The Render deployment loads from a fresh browser.
- Convex production data contains the three sourced public-profile records.
- One Playwright test and one manual two-minute rehearsal pass.

## 9. User Experience and Flows

### Page structure

The application has only `/`.

Shared header:

- RescueRelay name and one-sentence description
- Donor/Recipient role switch
- WebMCP support indicator
- **Reset demo** control

Donor workspace:

- Prefilled structured offer form
- Eligibility result cards
- Visible exclusion explanations
- Prepared reservation summary
- Human-only **Send reservation** button
- Current reservation status

Recipient workspace:

- Pending reservation or clear empty state
- Meal, allergen, storage, quantity, and pickup facts
- Accept/decline response preparation
- Human-only final confirmation
- Current reservation status

Shared activity panel:

- Latest tool name
- Safe summary of inputs
- Result summary
- Timestamp
- Collapsible presentation; no separate diagnostics route

### Donor flow

1. Open or create a session URL in Donor mode.
2. Review the prefilled meal facts and handling declaration.
3. Create the offer manually or ask the agent to do it.
4. Run matching manually or through the agent.
5. Review one match and two exclusion reasons.
6. Prepare the reservation.
7. Review the exact partner, quantity, facts, and pickup window.
8. Press **Send reservation**.

### Recipient flow

1. Open the same session URL in Recipient mode.
2. See the reservation appear without refreshing.
3. Review all handling and pickup facts.
4. Prepare `accept` or `decline` manually or through the agent.
5. Review the exact response.
6. Press the visible final confirmation.
7. See the terminal state; the donor view updates at the same time.

### Empty and failure states

- No offer: explain how to start in Donor mode.
- No sent reservation: show a calm Recipient empty state.
- Unsupported WebMCP: explain that manual UI still works.
- Validation error: identify the field and correction.
- Stale state: reload current state and prepare again.
- Invalid transition: explain the only allowed next action.

## 10. MVP Scope and Non-Goals

### Included

- One New York City public-profile pilot slice
- One donor and one fixed offer type
- Three seeded public-profile records
- One-page two-role interface
- Seven hard eligibility rules
- Five first-party WebMCP tools
- Donor send and recipient response confirmations
- Realtime shared state
- Session-scoped reset
- Render deployment, Convex production backend, focused tests, and submission materials

### Explicitly excluded

- Public marketplace or public listings
- Partner onboarding or multi-tenant administration
- Production authentication or authorization
- Food-safety certification, legal advice, or universal temperature rules
- AI-based eligibility or recipient ranking
- Driver dispatch, routes, maps, distance estimates, or transport guarantees
- Payments, checkout, tax receipts, or donation valuation
- Email, SMS, or push notifications
- Partial quantities, counteroffers, modification, cancellation, or expiry workflows
- Pickup/receipt evidence, beneficiary records, or personal health information
- Dedicated diagnostics route, dashboard metrics, animation system, or marketing site
- Shopify or another external WebMCP site on the RescueRelay critical path

## 11. Experience and Visual Direction

The product should feel like humane, trustworthy logistics with calm urgency. Avoid charity clichés, emergency-red dominance, or a dense enterprise dashboard.

Suggested visual language:

- Deep navy for structure and trust
- Teal/green for eligible and completed states
- Warm cream for the page background
- Coral/orange only for confirmations, constraints, and warnings
- Friendly geometric headings with a highly legible system sans-serif for operational text
- Clear cards, status chips, handoff arrows, and small timestamp indicators

The essential UI principle is transparency: every agent-prepared action must be visible and reviewable before a person commits.

## 12. Technical Stack

| Layer | Choice | Responsibility |
|---|---|---|
| Frontend | React + TypeScript + Vite | One-page interface, role switch, forms, statuses, and WebMCP adapter |
| Styling | Plain CSS | Responsive layout and visual states without a framework dependency |
| Backend/database | Convex | Seed data, queries, validated atomic mutations, and realtime subscriptions |
| Hosting | Render Static Site | Serve the production Vite build over HTTPS |
| Unit tests | Vitest | Eligibility, invariants, and state-transition coverage |
| Browser test | Playwright | Complete two-context rescue flow |
| Agent interface | Browser WebMCP API | Feature detection, role-aware tool registration, cleanup, and tool handlers |

Dependencies deliberately not used: React Router, Tailwind, React Hook Form, Zod, Testing Library, a separate API server, and a client-side state-management framework.

## 13. Architecture

```text
Render Static Site
┌──────────────────────────────────────────────────────────────┐
│ One React page                                               │
│                                                              │
│ Donor workspace     Recipient workspace     Tool activity    │
│          \                 /                     ▲            │
│           \               /                      │            │
│            Shared application actions ← WebMCP adapter       │
└────────────────────────────┬─────────────────────────────────┘
                             │ Convex client
                             ▼
Convex
┌──────────────────────────────────────────────────────────────┐
│ Queries • validated atomic mutations • realtime subscriptions│
│                                                              │
│ partners                 offers                 reservations  │
└──────────────────────────────────────────────────────────────┘
```

### Architectural rules

1. UI handlers and WebMCP handlers call the same typed application actions.
2. Convex validators and mutations are authoritative; browser validation exists for usability only.
3. The eligibility function is pure and independently testable.
4. Every consequential mutation rereads current state inside the transaction.
5. One session has at most one offer, and one offer has at most one reservation.
6. Convex realtime queries synchronize the donor and recipient contexts.
7. No model output is stored as authoritative eligibility evidence.

## 14. Session Model

On first load without a query value, the client generates a random `demoSessionId` and updates the URL to `?session=<id>`. The app may remember the latest URL locally for convenience, but the URL is the source of sharing.

- Donor and recipient contexts use the same URL.
- Operational queries always filter by the session ID.
- Reset deletes offers and reservations only for that session.
- Seeded partners are shared read-only fixtures.
- The session ID is intentionally not described as authentication, authorization, or a secret.

For a production product, sessions would be replaced by authenticated organization membership and server-enforced authorization. That work is outside the hackathon MVP.

## 15. Data Model

Convex supplies `_id` and creation metadata as appropriate. The fields below are the application-owned minimum.

### `partners`

Seeded, read-only recipient rules:

| Field | Type | Purpose |
|---|---|---|
| `slug` | string | Stable fixture identifier |
| `name` | string | Fictional display name |
| `active` | boolean | Eligibility gate |
| `acceptedCategories` | string[] | Accepted meal categories |
| `requiresSealedPackaging` | boolean | Packaging rule |
| `requiresAllergenInformation` | boolean | Allergen-information rule |
| `acceptedStorageModes` | string[] | `chilled`, `hot`, or `ambient` capabilities |
| `pickupStart` | `HH:mm` string | Earliest pickup time |
| `pickupEnd` | `HH:mm` string | Latest pickup time |
| `capacityMeals` | optional positive integer | Publicly declared capacity when a profile publishes one; otherwise the UI requires human confirmation |

Required index: unique or seed-enforced `slug`.

### `offers`

| Field | Type | Purpose |
|---|---|---|
| `demoSessionId` | string | Demo isolation |
| `mealCategory` | string | Fixed scenario category |
| `quantity` | positive integer | Number of meals |
| `sealed` | boolean | Donor packaging declaration |
| `allergenInformationPresent` | boolean | Donor declaration |
| `allergens` | string[] | Displayed allergen list |
| `storageMode` | string | Donor-declared storage condition |
| `pickupStart` | `HH:mm` string | Proposed pickup start |
| `pickupEnd` | `HH:mm` string | Proposed pickup end |
| `handlingDeclarationAccepted` | boolean | Required acknowledgment |
| `createdAt` | timestamp | Activity display |

Required index: `by_demo_session` on `demoSessionId`.

There is no separate offer-status field. The reservation is the sole source of workflow state.

### `reservations`

| Field | Type | Purpose |
|---|---|---|
| `demoSessionId` | string | Demo isolation |
| `offerId` | Convex ID | Source offer |
| `partnerId` | Convex ID | Selected eligible recipient |
| `status` | enum | `prepared`, `sent`, `accepted`, or `declined` |
| `responseDraft` | optional enum | `accept` or `decline` before final confirmation |
| `events` | small object[] | Safe allowlisted activity timeline |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Latest transition time |

Required indexes: `by_demo_session` and `by_offer`.

Each event contains only:

- event type
- actor role: `donor`, `recipient`, `agent`, or `system`
- short allowlisted summary
- timestamp

A separate audit table is unnecessary for the fixed demonstration.

## 16. Deterministic Eligibility Engine

The engine evaluates every partner in this order:

| Order | Check | Failure code |
|---:|---|---|
| 1 | Partner is active | `PARTNER_INACTIVE` |
| 2 | Meal category is accepted | `CATEGORY_NOT_ACCEPTED` |
| 3 | Packaging is sealed when required | `SEALED_PACKAGING_REQUIRED` |
| 4 | Allergen information is present when required | `ALLERGEN_INFORMATION_REQUIRED` |
| 5 | Storage mode is supported | `STORAGE_UNSUPPORTED` |
| 6 | Pickup windows overlap | `PICKUP_WINDOW_MISMATCH` |
| 7 | Quantity does not exceed capacity | `CAPACITY_EXCEEDED` |

The function returns:

- `eligible[]`
- `excluded[]`
- all failure codes relevant to each excluded partner
- a plain-language explanation for every code

There is no ranking algorithm because the deterministic pilot has exactly one preliminary fit. Public profiles may omit capacity; an omitted capacity is not treated as zero and must be confirmed by a person before a real handoff.

The server reruns eligibility during `prepareReservation` and `sendPreparedReservation`. A stale or manipulated browser result therefore cannot create or send an invalid reservation.

## 17. WebMCP Integration

### Registration lifecycle

1. Detect whether the target browser exposes the expected WebMCP API.
2. Show `Supported` or `Manual mode` in the header.
3. In Donor mode, register the three donor tools.
4. In Recipient mode, register the two recipient tools.
5. On role switch, unregister the old tool set before registering the new one.
6. On component unmount or page disposal, clean up every registration.
7. Record only a safe summary of the latest call in the activity panel.

The exact experimental browser API surface must be confirmed in task 1 before full implementation. All WebMCP-specific calls belong in one adapter so an API change does not affect domain logic or UI components.

### Tool contracts

#### `create_surplus_offer` — Donor

Input:

- meal category
- positive quantity
- sealed declaration
- allergen-information declaration and allergen list
- storage mode
- pickup start and end
- handling-declaration acknowledgment

Returns:

- offer ID
- normalized offer summary
- whether the record was newly created or an identical retry

Server guards:

- validate field types, bounds, and time order
- require the handling acknowledgment
- allow one offer per session
- return the existing record only when an identical retry is safe; otherwise return `INVALID_STATE`

#### `find_eligible_partners` — Donor

Input: offer ID.

Returns:

- eligible partner summaries
- excluded partner summaries
- stable reason codes
- plain-language explanations

Server guards:

- load the offer from the current session
- load seeded partners from Convex
- run the seven deterministic checks
- never return an excluded partner as eligible

#### `prepare_reservation` — Donor

Input: offer ID and selected partner ID.

Returns:

- reservation ID
- exact partner, meal, quantity, handling, and pickup summary
- `prepared` status

Server guards:

- rerun eligibility
- require the selected partner to remain eligible
- enforce one reservation per offer
- create no external commitment

#### `get_pending_offer` — Recipient

Input: no fields; current session is implicit.

Returns:

- the current sent reservation and handling facts, or an empty result

Server guards:

- filter by current session
- return only a reservation in `sent` state for response preparation

#### `prepare_response` — Recipient

Input: reservation ID and `accept` or `decline`.

Returns:

- stored response draft
- exact final-review summary
- current reservation status

Server guards:

- require `reservation.sent`
- store no terminal outcome
- reject unsupported response values

### Human-only final actions

The following application mutations are not registered as WebMCP tools:

- `sendPreparedReservation(reservationId)`
- `confirmPreparedResponse(reservationId)`

This boundary is a central product feature, not a temporary limitation. The agent structures, checks, and prepares; a person makes each organizational commitment.

### AI usage

The browser agent may:

- translate natural language into tool inputs
- choose which read/preparation tool to call
- summarize deterministic results
- explain exclusion reasons and the next available action

The agent may not:

- decide eligibility outside the seven rules
- invent missing handling facts
- bypass server validation
- send or accept a reservation autonomously
- claim that food has been certified safe

## 18. Application Actions and State

### Shared application actions

| Action | Called by UI | Called by WebMCP | Effect |
|---|:---:|:---:|---|
| `createOffer` | Yes | Yes | Create or safely return the session offer |
| `findEligiblePartners` | Yes | Yes | Run deterministic matching |
| `prepareReservation` | Yes | Yes | Create the reviewable reservation |
| `sendPreparedReservation` | Yes | No | Human donor sends it |
| `getPendingOffer` | Yes | Yes | Read the current sent reservation |
| `prepareResponse` | Yes | Yes | Store accept/decline intent |
| `confirmPreparedResponse` | Yes | No | Human recipient finalizes the draft |
| `resetDemo` | Yes | No | Clear current-session operational records |

### State machine

```text
offer.created
    │ prepareReservation
    ▼
reservation.prepared
    │ donor presses Send reservation
    ▼
reservation.sent
    │ prepareResponse + recipient confirmation
    ├──────────────► reservation.accepted
    └──────────────► reservation.declined
```

Rules:

- Only the transition shown by an arrow is valid.
- Acceptance and decline are terminal for that demo session.
- Reset begins a new run in the same session.
- Convex mutations reread current state and enforce the next transition atomically.
- Identical safe retries may return the existing record.
- Conflicting retries return `STALE_STATE` or `INVALID_STATE`.
- Manual versions, short-lived review tokens, and a separate idempotency table are not needed for this MVP.

## 19. End-to-End Data Flow

1. A first visit creates `?session=<id>`.
2. `create_surplus_offer` or the donor form calls `createOffer`.
3. Convex validates the declarations and creates the session’s single offer.
4. `find_eligible_partners` or the UI calls the pure eligibility function through Convex.
5. The donor sees one match and two explained exclusions.
6. `prepare_reservation` reruns eligibility and creates `reservation.prepared`.
7. The donor reviews the exact summary and presses **Send reservation**.
8. Convex verifies current state and eligibility, then changes the reservation to `sent`.
9. The recipient context receives the sent reservation through a realtime query.
10. `prepare_response` or the recipient UI stores `accept` or `decline` as a draft.
11. The recipient reviews the exact outcome and confirms it visibly.
12. Convex atomically changes the reservation to `accepted` or `declined`.
13. Both role views reactively display the terminal state.

## 20. Components and Responsibilities

### `App`

Implements: E1, E5, E6.

- Parse or generate the session URL
- Own the selected role
- Render the header and correct workspace
- Coordinate WebMCP registration lifecycle
- Provide Reset and status messaging

### `DonorWorkspace`

Implements: E2 and E3.

- Render the offer form
- Create the offer
- Display matching and exclusion cards
- Prepare the reservation
- Render the donor confirmation summary
- Call the human-only send mutation

### `RecipientWorkspace`

Implements: E4.

- Subscribe to the current session reservation
- Display handling and pickup facts
- Prepare accept or decline
- Render the final response confirmation
- Call the human-only terminal mutation

### `ToolActivity`

Implements: E5.

- Show the latest allowlisted tool activity
- Avoid raw payload dumps and stack traces
- Remain inline and collapsible

### `eligibility`

Implements: E2.

- Pure seven-rule evaluation
- Stable reason codes
- Plain-language explanation mapping
- No React, Convex, or AI dependencies

### `actions`

Implements: E2, E3, and E4.

- Present one typed interface to UI and WebMCP handlers
- Call Convex queries and mutations
- Normalize application errors

### `webmcp`

Implements: E5.

- Feature detection
- Strict tool schemas
- Role-aware registration and cleanup
- Safe conversion between tool payloads and application actions
- Activity reporting

### Convex functions

Implements: E1–E6.

- Schema and indexes
- Seeded partner fixtures
- Offer creation and reset
- Eligibility query wrapper
- Reservation preparation and transitions
- Realtime session queries

## 21. File Structure

```text
src/
├── App.tsx                         # session, role, page composition
├── main.tsx                        # React entry point and Convex provider
├── styles.css                      # complete responsive styling
├── components/
│   ├── DonorWorkspace.tsx          # offer, matching, prepare, send
│   ├── RecipientWorkspace.tsx      # pending offer, draft, confirm
│   └── ToolActivity.tsx            # compact WebMCP activity panel
├── domain/
│   ├── eligibility.ts              # pure rules and explanations
│   └── types.ts                    # shared domain and action types
├── lib/
│   ├── actions.ts                  # shared UI/tool application actions
│   ├── session.ts                  # query-param session lifecycle
│   └── webmcp.ts                   # adapter and five tool contracts
└── tests/
    ├── eligibility.test.ts         # fixed fixture + seven failure cases
    └── state.test.ts               # invariants and transitions
convex/
├── schema.ts                       # three tables and indexes
├── seed.ts                         # three deterministic partner fixtures
├── offers.ts                       # create/read/reset offer operations
└── reservations.ts                 # match, prepare, send, draft, confirm
e2e/
└── rescue-flow.spec.ts             # two-context production-like flow
public/
└── favicon.svg                     # simple RescueRelay mark
README.md                            # setup, architecture, testing, demo
package.json                         # scripts and minimal dependencies
```

This is a maximum useful split, not a file quota. Files may be combined if the result is clearer.

## 22. Validation and Error Strategy

### Client validation

- Required fields
- Positive whole-number quantity
- Pickup start before pickup end
- Allergen list required when allergen information is declared present for the scenario
- Handling acknowledgment required

Client validation improves usability but never authorizes a mutation.

### Server validation

- Repeat every input and time-order check
- Confirm the offer belongs to the current session
- Enforce one offer and one reservation invariants
- Rerun eligibility before preparation and send
- Enforce the reservation state machine
- Filter all queries and reset operations by session
- Allowlist event and activity fields

### Structured errors

| Code | Meaning | Recovery shown to user |
|---|---|---|
| `VALIDATION_ERROR` | Missing, malformed, or out-of-range data | Correct the highlighted input |
| `STALE_STATE` | State changed after preparation | Reload current state and prepare again |
| `INVALID_STATE` | Action is not permitted from the current state | Show the one valid next action or suggest Reset |

Tool outputs include the code, a short safe message, and a recovery hint. They never include raw exceptions or stack traces.

## 23. Safety, Security, and Privacy

### Required product language

- Use “declared handling information,” not “verified safe food.”
- State that RescueRelay supports coordination and does not certify safety.
- State that recipient organizations apply their own acceptance procedure.
- Do not imply transport, legal, or capacity guarantees.

### Data minimization

Store:

- allowlisted organization-level public-profile data (source URL and snapshot date included)
- meal and handling declarations
- pickup window
- reservation status
- allowlisted demo activity

Do not store:

- beneficiary identities
- health records
- home addresses
- payment information
- private organization contacts
- secrets or access tokens
- free-form agent transcripts

### Demo security boundary

The session URL isolates demonstrations but is not secure access control. Production deployment notes and UI copy must not represent it as authentication. Anyone with the URL may view that pilot session’s demo state.

### Prompt and tool-output safety

- Treat tool arguments and returned text as untrusted input.
- Use enums, numeric bounds, and short strings rather than arbitrary HTML or Markdown.
- Escape all displayed content through React’s normal rendering.
- Never execute text returned by an agent or store it as an application command.
- Keep activity metadata on a fixed allowlist.

## 24. Accessibility Requirements

- Semantic headings and landmark structure
- Native labels, fieldsets, and buttons
- Validation messages associated with their fields
- Visible keyboard focus
- Complete keyboard path for both roles
- Status expressed with text, not color alone
- `aria-live` for matching and reservation updates
- Focus moves to each newly prepared confirmation summary
- Confirmation buttons state the exact consequence
- One useful mobile breakpoint with no horizontal overflow
- Manual keyboard and mobile-width review before deployment

## 25. Testing and Verification

### Vitest

Required tests:

- Fixed offer produces exactly one eligible and two excluded partners.
- Each of the seven eligibility rules has one focused failure case.
- Reason codes map to the correct explanations.
- A session cannot create a second conflicting offer.
- An offer cannot create a second reservation.
- Only `prepared → sent → accepted|declined` transitions succeed.
- Sending reruns eligibility and rejects an invalid or over-capacity offer.
- Reset affects only the current session.

### Playwright

One complete test opens two isolated browser contexts with the same session URL:

1. Reset the session.
2. Create the fixed offer in Donor mode.
3. Confirm one match and two exclusions.
4. Prepare and human-send the reservation.
5. Observe it in the Recipient context without refresh.
6. Prepare and human-confirm acceptance.
7. Confirm that the Donor context displays `accepted`.

### Manual verification

- WebMCP support indicator in a supported browser
- Role switch does not leave duplicate or stale tools
- Malformed, stale, and invalid-state tool calls fail safely
- Unsupported browser retains full manual operation
- Keyboard-only donor and recipient paths
- One mobile-width pass
- Two clean demo resets

Not required for the MVP: component snapshots, exhaustive browser matrices, performance benchmarking, visual-regression infrastructure, or a separate accessibility automation suite.

## 26. Deployment

### Convex

- Create the production deployment.
- Deploy schema, seed, offer, and reservation functions.
- Seed the three sourced public-profile records deterministically.
- Record the production Convex URL.

### Render Static Site

- Connect the project repository.
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_CONVEX_URL=<production Convex URL>`
- Use the public HTTPS URL for testing and submission.

There are no application routes beyond `/`, so a complex rewrite configuration is unnecessary.

### Production smoke test

- Open a clean session URL.
- Complete the full rescue loop.
- Confirm WebMCP tools in the supported target browser.
- Confirm the manual fallback in a normal unsupported browser.
- Reset and repeat without database repair.

## 27. Build Sequence

### Task 1 — WebMCP spike

Detect the API, register one read-only test tool, call it, show activity, and clean it up. Resolve API-shape uncertainty before building the application.

### Task 2 — One-page foundation and Convex schema

Create the React/Vite shell, plain CSS, session URL, role switch, three tables, seed, and session-scoped reset.

### Task 3 — Eligibility and first real tools

Build the pure rule engine, reason codes, tests, `create_surplus_offer`, and `find_eligible_partners`.

Checkpoint A: the target browser creates the fixed offer and returns one match plus two explained exclusions.

### Task 4 — Donor half

Build the donor form, results, `prepare_reservation`, exact review summary, tool activity, and human-only send.

### Task 5 — Recipient and realtime half

Build the recipient inbox, `get_pending_offer`, `prepare_response`, final human confirmation, and realtime terminal state.

Checkpoint B: two browser contexts on the same URL complete the human-confirmed rescue.

### Task 6 — Tool hardening and essential accessibility

Finish all five schemas, role-aware lifecycle, three error families, allowlisted activity, keyboard focus, live statuses, and mobile layout.

### Task 7 — Deploy and prove

Deploy Convex and Render, run the Playwright flow, manually verify browser support/fallback, and rehearse under two minutes.

Checkpoint C: the public URL passes the complete test from a clean session.

### Task 8 — Submission material

Prepare the README, architecture image, two or three accurate screenshots, testing instructions, project description, and short narrated demo.

## 28. Two-Minute Demo Script

1. **0:00–0:15 — Context:** “Cedar Events has 36 sealed, chilled vegetarian meals with dairy information, available from 7:00 to 8:00.”
2. **0:15–0:35 — Agent creates:** Ask the agent to create the structured offer.
3. **0:35–0:55 — Transparent matching:** Ask it to find eligible recipients; show one match and two deterministic exclusion reasons.
4. **0:55–1:15 — Agent prepares:** Ask it to prepare the reservation; point out that preparation did not send it.
5. **1:15–1:25 — Donor authority:** Review and press **Send reservation**.
6. **1:25–1:40 — Realtime handoff:** Show the same session in Recipient mode or the second context.
7. **1:40–1:52 — Agent prepares response:** Ask the agent to prepare acceptance.
8. **1:52–2:00 — Recipient authority:** Press **Confirm acceptance** and show the accepted state in both views.

The main flow itself demonstrates the safety guardrail, so a separate “blocked unsafe call” vignette is unnecessary.

## 29. Judging-Criteria Fit

| Criterion | Evidence |
|---|---|
| Usefulness | Addresses a time-sensitive coordination bottleneck that contributes to food waste |
| Originality | Applies WebMCP to a two-sided real-world handoff rather than ordinary browsing or form filling |
| Execution | One deterministic, deployed loop with realtime shared state and a repeatable reset |
| Thoughtful WebMCP use | Five first-party tools expose meaningful structured actions without surrendering final authority |
| Human-agent experience | The agent prepares and explains; people review and commit in the same visible interface |
| Trust and safety | Deterministic rules, transparent exclusions, minimal data, and explicit non-certification language |

## 30. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Experimental WebMCP API differs in the target browser | Complete the registration spike first and isolate API calls in one adapter |
| Browser has no WebMCP support | Show Manual mode and keep the complete UI functional |
| Two role views do not share state | Use the same generated session URL and Convex realtime queries |
| Retry or double click creates duplicates | Enforce one offer/session and one reservation/offer inside atomic mutations |
| State changes after preparation | Reread current state and return `STALE_STATE` |
| Ineligible partner is selected | Rerun all rules before preparation and send |
| Agent appears to certify food or make a commitment | Use declaration language and exclude final actions from WebMCP |
| Demo leaks sensitive data | Use public organization profiles and allowlisted fields only |
| Schedule pressure | Cut polish and submission extras before weakening the complete loop |
| Network adoption is questioned | Frame RescueRelay as software for an existing opt-in network, not a public trust marketplace |

## 31. Cut Line

If time becomes limited, keep all of the following:

- One fixed offer
- Three sourced NYC public-profile records
- Seven deterministic checks
- Five WebMCP tools
- Donor and recipient confirmation gates
- Shared session URL
- Realtime accepted/declined result
- Focused unit tests
- One Playwright flow
- Public Render deployment

Cut first:

- Decorative animation
- Extra scenarios or recipients
- Additional screenshots
- Extended activity history
- Advanced visual polish
- Any bonus ReliefCart or Shopify demonstration

Never cut the deterministic rules, two confirmation gates, WebMCP proof, or complete end-to-end flow.

## 32. Definition of Done

The project is complete when:

- A public Render URL loads from a fresh browser.
- Convex production contains the deterministic NYC public-profile records.
- The page has one route and two role workspaces.
- Exactly five WebMCP tools register in the correct role sets.
- The fixed offer produces one match and two explained exclusions.
- The agent can prepare but cannot perform either final commitment.
- Donor and recipient confirmations work visibly.
- The terminal result appears in both views without refresh.
- Reset is repeatable and session-scoped.
- Required Vitest coverage and the Playwright rescue flow pass.
- The manual keyboard and mobile checks pass.
- README, screenshots, testing instructions, and the short demo accurately describe the working build.

Anything outside this list is deferred unless it replaces an included item.

## 33. Deferred Production Work

If RescueRelay moves beyond the hackathon, the next design phase would need to address:

- authenticated organizations and role-based authorization
- real partner onboarding and rule administration
- jurisdiction-specific handling policies reviewed by experts
- live capacity ownership and conflict resolution across organizations
- notifications and accountable organization contacts
- operational pickup/receipt workflow
- retention, deletion, audit, and incident policies
- accessibility testing across supported browsers and assistive technologies
- monitoring, backups, support, and disaster recovery

These are not hidden MVP requirements and should not be partially implemented during the hackathon.

## 34. Documentation Links

- [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)
- [WebMCP Community Group draft](https://webmachinelearning.github.io/webmcp/)
- [React documentation](https://react.dev/)
- [Vite guide](https://vite.dev/guide/)
- [Convex documentation](https://docs.convex.dev/)
- [Render Static Sites documentation](https://render.com/docs/static-sites)
- [Vitest documentation](https://vitest.dev/)
- [Playwright documentation](https://playwright.dev/)

Because WebMCP remains an evolving browser capability, implementation must treat the task-1 compatibility spike and the target browser’s observed API as authoritative for code details.

Use the official DevPost plugin to double check the required materials for submission for this hackathon. 
