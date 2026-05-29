---
shaping: true
artifact_type: context-packet
status: draft-v1.0
---

# Codex Context Packet — Project Latitude V1.0 / Slice S1

## Task

Build **Slice S1: Manual Blueprint Canvas** only.

Do not build AI structuring, dictation, export, Miro integration, auth, multiplayer, or automatic Codex execution yet.

## Source Artifacts

| Artifact | Authority |
|---|---|
| `shaping.md` | Ground truth for requirements, selected shape, fit checks, full breadboard. |
| `slices.md` | Ground truth for slice scope, sequencing, demo scripts, verification checks. |
| `spike-export-contract.md` | Background for later Slice S3 export design; do not implement in S1. |

## Authority Order

| Rank | Authority |
|---:|---|
| 1 | User’s latest explicit instruction |
| 2 | This Codex Context Packet |
| 3 | `slices.md` |
| 4 | Selected breadboard in `shaping.md` |
| 5 | Selected Shape A in `shaping.md` |
| 6 | Raw idea PDF / brainstorm |
| 7 | Rejected shapes B and C |

## Use These Sections First

| Artifact | Sections |
|---|---|
| `slices.md` | S1: Manual Blueprint Canvas; S1 Demo Script; S1 Verification Plan; S1 Affordance Subset |
| `shaping.md` | Requirements R0–R8; A: Local AI Shaping Canvas; Breadboard tables; Data Stores / State |

## Do Not Use Unless Needed

| Section | Reason |
|---|---|
| Shape B: Miro App / MCP Prototype | Rejected for V1. |
| Shape C: Chat-First Shaping Assistant | Rejected because it loses spatial canvas. |
| S2 / S3 scope | Later slices only. |
| Full Miro/MCP idea | Strategic direction, not V1 build scope. |

## Must Preserve

| ID | Constraint |
|---|---|
| MP1 | Build one small local web app. |
| MP2 | S1 must work without AI/API keys. |
| MP3 | Three-lane layout: input/history, canvas, inspector. |
| MP4 | Typed cards must be editable and draggable. |
| MP5 | Local persistence must survive refresh. |
| MP6 | Use the stable IDs in planning docs when naming concepts in comments/docs/UI labels where helpful. |
| MP7 | No high-fidelity prototype generation. This is a low-fidelity shaping surface. |
| MP8 | No implementation of S2/S3 until S1 demo passes. |

## Selected Requirements

| Req | Requirement |
|---|---|
| R0 | A non-technical or semi-technical builder can describe a product idea in plain language and see it become visible product structure. |
| R1 | The workspace must be spatial enough to show screens, actions, flows, rules, data, risks, and slices at once instead of only as a linear chat. |
| R2 | Canvas artifacts must be typed so the app and downstream agents can tell whether an item is a requirement, place/screen, user action, system rule, data object, risk, open question, slice, or acceptance check. |
| R3 | The user must be able to inspect and edit the shaped blueprint directly without touching implementation code. |
| R5 | The V1 must be simple enough for Codex to implement as one small web app for a non-technical user. |
| R6 | The product must avoid premature high-fidelity design/prototype generation and focus on low-fidelity shaping. |
| R7 | The tool must preserve enough intent and shaping history that the user is not left with a mysterious generated artifact. |
| R8 | The MVP must have an obvious demo path: idea in → typed canvas → editable blueprint → export packet → first build slice ready. |

## Relevant Places / Affordances / Stores for S1

| Kind | IDs |
|---|---|
| Places | P1, P1.1, P1.2, P1.3, P3 |
| UI | U1, U2, U6, U7, U8, U9, U10, U11, U15 |
| Code | C1, C3, C8, C9, C10, C13, C14 |
| Data | D1, D2, D3, D4, D8, D10 |

## Lightweight Data Shapes

These are planning structures, not strict implementation schemas.

### Card

| Field | Meaning |
|---|---|
| id | Stable card ID. |
| type | requirement, place, action, rule, data, risk, question, slice, acceptance. |
| title | Short visible label. |
| body | Editable description. |
| status | draft, accepted, question, risk, cut. |
| x/y | Canvas position. |

### Connector

| Field | Meaning |
|---|---|
| id | Stable connector ID. |
| from | Source card ID. |
| relation | flow, depends-on, satisfies, blocks, belongs-to. |
| to | Target card ID. |

## Current Slice

| Field | Definition |
|---|---|
| Slice | S1: Manual Blueprint Canvas |
| Demo | Open app → add title → type idea → add typed card → edit card → drag card → refresh → state remains. |
| Produces | A saved local shaping session with a title, transcript, draggable typed cards, editable card details, and refresh-safe state. |
| Exclusions | AI structuring, dictation, export packet, generated slices, copy/download, Miro, auth, multiplayer. |

## S1 Demo Script

| Step | Action | Expected Behavior |
|---:|---|---|
| 1 | Open the app. | Empty shaping session appears with input/history lane, canvas, inspector, and save status. |
| 2 | Enter a project title. | Title appears and save status confirms local save. |
| 3 | Type a product idea into the transcript input. | Transcript is visible/preserved in the input lane. |
| 4 | Click manual add-card. | A new typed card appears on the canvas. |
| 5 | Select the card and change type/title/body in inspector. | Card updates immediately on canvas. |
| 6 | Drag the card to a new position. | Card remains in the new position. |
| 7 | Refresh the browser. | Title, transcript, card content, and card position remain. |
| 8 | Produces: | A local manual blueprint canvas ready for AI operations in S2. |

## S1 Verification Target

| Check | Verification |
|---|---|
| VP1 | App can be opened locally and shows the three-lane layout. |
| VP2 | Manual card creation works. |
| VP3 | Card selection and inspector editing work. |
| VP4 | Card drag updates position. |
| VP5 | Refresh restores session state from local storage. |
| VP6 | No external AI/API key is required for S1. |

## Required Behavior for Codex

| # | Behavior |
|---:|---|
| 1 | Restate the S1 constraints before planning. |
| 2 | Identify implementation implications for the UI, state, and persistence. |
| 3 | Ask at most three blocking questions. |
| 4 | Propose a plan before editing files. |
| 5 | Build S1 only. |
| 6 | After implementation, run the S1 demo script and report pass/fail for each verification check. |
| 7 | If implementation reality changes a planning assumption, propose a planning update instead of silently drifting. |

## Non-Goals For S1

| Non-goal | Reason |
|---|---|
| AI-generated cards | Slice S2. |
| Browser dictation | Slice S2 optional. |
| Export packet | Slice S3. |
| Miro integration | Cut from V1. |
| Multiplayer | Cut from V1. |
| Auth/accounts/cloud sync | Cut from V1. |
| High-fidelity UI/prototypes | Violates R6. |
| Auto-running Codex or creating repos | Cut from V1. |

## Hand-off Prompt To Paste Into Codex

Use the planning artifacts in this folder. Build **Slice S1: Manual Blueprint Canvas** only.

Start by reading:
1. `codex-context-packet.md`
2. `slices.md` → S1 sections
3. `shaping.md` → Requirements R0–R8, Shape A, Breadboard tables

Before editing code, restate:
- what S1 includes
- what S1 excludes
- which affordance IDs you are implementing
- the manual verification script you will run

Then propose the smallest implementation plan for a local web app. Do not implement S2 or S3.
