---
name: RescueRelay
description: Calm, transparent logistics for a human-approved food-rescue handoff.
colors:
  structure-navy: "#172554"
  structure-navy-deep: "#0b1538"
  trust-teal: "#0f766e"
  trust-teal-soft: "#dff3ee"
  rescue-leaf: "#65a30d"
  rescue-leaf-soft: "#eef8d9"
  warm-cream: "#fff7e6"
  paper: "#fffdf8"
  approval-coral: "#f36f5f"
  approval-coral-deep: "#b9382c"
  ink: "#172033"
  muted-ink: "#566071"
  rule: "#d9d5ca"
typography:
  display:
    fontFamily: "ui-rounded, 'Avenir Next', system-ui, sans-serif"
    fontSize: "clamp(2.35rem, 4vw, 4.2rem)"
    fontWeight: 750
    lineHeight: 0.96
  headline:
    fontFamily: "ui-rounded, 'Avenir Next', system-ui, sans-serif"
    fontSize: "clamp(1.65rem, 2.7vw, 2.45rem)"
    fontWeight: 700
    lineHeight: 1.08
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.95rem"
    fontWeight: 450
    lineHeight: 1.55
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  compact:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.4
  data:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2.65rem"
    fontWeight: 780
    lineHeight: 1
rounded:
  control: "10px"
  surface: "14px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.structure-navy}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-confirm:
    backgroundColor: "{colors.approval-coral}"
    textColor: "{colors.structure-navy-deep}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
---

# Design System: RescueRelay

## Overview

**Creative North Star: “The Handoff Ledger”**

RescueRelay feels like a carefully run dispatch desk: calm, legible, and accountable under time pressure. A visible handoff rail links the donor’s declared facts, deterministic matching, and the recipient’s decision. Expressive moments come from large operational type, colored state fields, and precise timeline markers rather than decorative illustration.

**Key Characteristics:** restrained cream-and-navy structure; teal and leaf for eligibility; coral only at consequential review points; concise operational language; reviewable state transitions.

## Colors

Warm paper surfaces reduce fatigue while deep navy supplies durable structure. Teal and leaf communicate compatible/completed states; coral is scarce and belongs to confirmations, constraints, and recovery.

## Typography

Rounded system display faces make the product humane without sacrificing speed. The operational body stack remains familiar and highly legible. Headings balance naturally; body copy stays within roughly 70 characters per line; numbers and timestamps use tabular figures.

## Layout

The product is a compact coordination console, not a split-screen landing page. A full-width header keeps the role switch and session controls stable. The first viewport establishes the fixed scenario, the agent/human authority boundary, and all six lifecycle stages before the active workspace begins. The workspace uses one broad operational ledger plus a narrow evidence rail for tools, activity, allowlisted events, and safety. At tablet and mobile widths, every region becomes a single vertical flow and the role switch remains at the top.

## Elevation & Depth

The system is flat by default. Tonal fields and single 1px rules establish hierarchy; only the active confirmation surface receives a soft offset shadow.

## Shapes

Controls use 10px corners and major surfaces use 14px corners. Pills are reserved for compact statuses and role switching. Handoff lines, dots, and timestamp markers provide the recurring geometry.

## Components

Buttons name their exact consequence. Inputs use paper backgrounds, quiet rules, and an obvious navy focus ring. Result rows are structured lists rather than a grid of identical cards. The six-stage rail is persistent evidence of shared state. The confirmation panel is the signature component: it restates the exact partner, quantity, handling facts, and consequence before the human action.

## Do's and Don'ts

### Do:

- **Do** show why every recipient matched or was excluded.
- **Do** keep coral rare so the confirmation boundary remains unmistakable.
- **Do** use native controls, visible focus, and text alongside color for every state.

### Don't:

- **Don't** imply food was verified safe, transport is guaranteed, or the session URL is secure access control.
- **Don't** add maps, dashboard metrics, decorative animation, gradients, or charity imagery.
- **Don't** hide final commitments inside agent tools or generic “Continue” labels.
