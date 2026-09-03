# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

RescueRelay serves coordinators rehearsing a food-rescue handoff with a small New York City public-data pilot. Donor coordinators need to place packaged surplus quickly; recipient coordinators need complete handling and timing facts before agreeing. A compatible browser agent may translate natural-language requests into the site’s structured WebMCP tools.

## Product Purpose

RescueRelay turns one batch of surplus meals into a transparent, human-approved handoff. Success is a repeatable demonstration in which a donor records the fixed offer, deterministic rules identify exactly one eligible recipient and explain two exclusions, and people on both sides visibly confirm the reservation.

## Positioning

The site exposes its own first-party WebMCP tools while keeping eligibility deterministic and final organizational commitments human-only. The agent structures, checks, prepares, and explains; people commit.

## Operating Context

The hackathon MVP has a lightweight demo sign-in and two role-specific portals for a New York City public-data pilot. The fixed scenario is 36 sealed, chilled vegetarian meals with dairy information, available from 7:00–8:00 PM. Donor and recipient views share a generated session URL and update in real time when Convex is configured.

## Capabilities and Constraints

- One route with dummy email entry and Donor and Recipient modes.
- Live IRS-derived organization and filing records through the ProPublica API and an allowlisted proxy.
- Three seeded public-profile records, seven ordered eligibility rules, and exactly five WebMCP tools.
- The evidence rail distinguishes successful tool registration from an observed agent invocation.
- Donor send and recipient response confirmation remain visible UI actions and are not tools.
- React, TypeScript, Vite, plain CSS, Convex, Render, Vitest, and one Playwright flow.
- The session URL isolates pilot demos; it is not authentication.
- The application records declared handling information and never certifies food safety, transport, or recipient need.
- No marketplace, routing, payments, onboarding, notifications, partial quantities, or autonomous commitments.

## Brand Commitments

The product name is RescueRelay. The voice is precise, warm, and accountable. The experience should communicate calm urgency without charity clichés, panic red, or a dense enterprise-dashboard feel.

## Evidence on Hand

- Approved requirements and acceptance criteria: `spec.md`.
- Reviewed product, architecture, data, safety, and build-plan canvases: `webmcp_hack_openai.tldraw`.
- UI implementation guidance: `implemntation.md`.
- Registered names, addresses, EINs, tax classifications, and filing facts load from ProPublica’s IRS-derived API in the active browser session. Food-guidance mappings remain sourced repository facts. Neither is a partner confirmation, live capacity signal, or impact claim.

## Pilot Data and Safety Boundary

The runnable slice uses three New York City profiles: The Bowery Mission, City Harvest, and New York Common Pantry. Their registered organization and filing data loads live by EIN. Their published donation pages provide source material for a narrow pilot mapping of category, packaging, storage, and pickup-window checks. Where a page does not state a field explicitly, the UI treats the mapping as a pilot assumption. None of the pages publishes live intake capacity for this demo, so capacity remains a human confirmation rather than an invented number. The app simulates every send or response; it does not contact, notify, or speak for any organization.

## Product Principles

- Make every match and exclusion explainable.
- Keep one shared source of truth for people and agents.
- Prepare through tools; commit through visible human actions.
- Prefer the complete rescue loop over breadth or decorative polish.
- Collect only the facts needed for the public-profile coordination rehearsal.

## Accessibility & Inclusion

Use semantic landmarks and headings, native labeled controls, associated field errors, visible focus, text-based statuses, live announcements for workflow changes, keyboard-complete role flows, and a mobile layout without horizontal overflow.
