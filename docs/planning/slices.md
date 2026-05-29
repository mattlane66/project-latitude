---
shaping: true
artifact_type: slices
status: draft-v1.0
source_of_truth: true
---

# Project Latitude V1.0 — Slices

## Context Card

## Use this when
You are sequencing or implementing Project Latitude V1.0. `shaping.md` is the source of truth for requirements, selected shape, fit checks, and full breadboard. This file is the source of truth for slice scope and sequencing.

## Must preserve
- Build vertical slices; every slice must end in demoable UI.
- Do not build all slices at once.
- Preserve IDs from `shaping.md`.
- Start with manual/editable canvas before AI and export automation.
- Keep non-goals visible.

---

# Kick-off: From Selected Shape A to Slices

## Step 1 — Dump All Elements Implied by Selected Shape A

| # | Raw element |
|---|---|
| 1 | Single-page app shell |
| 2 | Project title field |
| 3 | One-line outcome field or project summary |
| 4 | Transcript input for product idea turns |
| 5 | Optional browser dictation button |
| 6 | Saved transcript/history list |
| 7 | Shape turn action |
| 8 | AI prompt builder that includes current transcript and blueprint |
| 9 | AI call boundary |
| 10 | Validated operation format for adding/updating cards |
| 11 | Operation reducer that updates canvas state |
| 12 | Error state for failed AI calls |
| 13 | AI-generated clarifying questions |
| 14 | AI-generated risks / assumptions |
| 15 | Spatial canvas area |
| 16 | Typed card rendering |
| 17 | Card positions |
| 18 | Card drag behavior |
| 19 | Card selection behavior |
| 20 | Manual add-card affordance |
| 21 | Card type selector |
| 22 | Card title editor |
| 23 | Card body editor |
| 24 | Card status editor |
| 25 | Connector rendering between cards |
| 26 | Connector creation from AI operations |
| 27 | Connector editing or deletion |
| 28 | Slice card type |
| 29 | Slice checklist |
| 30 | Acceptance check card type |
| 31 | Export packet preview |
| 32 | Export packet composer |
| 33 | Copy to clipboard |
| 34 | Download as Markdown |
| 35 | Local persistence |
| 36 | Save status indicator |
| 37 | Load saved session on refresh |
| 38 | Non-goals in export |
| 39 | Demo script in export |
| 40 | Verification checks in export |
| 41 | Active slice selection |
| 42 | Cut scope list |
| 43 | Empty state |
| 44 | Example starter prompt |
| 45 | No auth |
| 46 | No multiplayer |
| 47 | No high-fidelity mockups |
| 48 | No Miro API |
| 49 | Non-technical setup instructions |
| 50 | Codex context packet for Slice 1 |

## Step 2 — Affinitize

| Group | Items |
|---|---|
| Unnamed Group 1 | Single-page app shell; project title field; one-line outcome; empty state; non-technical setup instructions. |
| Unnamed Group 2 | Transcript input; transcript/history list; optional dictation; saved shaping history. |
| Unnamed Group 3 | Spatial canvas area; typed card rendering; card positions; drag; selection; manual add-card. |
| Unnamed Group 4 | Inspector; card type selector; title/body/status editor; selected card editing. |
| Unnamed Group 5 | Shape turn action; AI prompt builder; AI call boundary; validated operation format; operation reducer; AI errors. |
| Unnamed Group 6 | AI questions; risks; assumptions; starter slice generation. |
| Unnamed Group 7 | Connector rendering; connector creation; connector editing/deletion. |
| Unnamed Group 8 | Export packet preview; export composer; copy/download; non-goals; demo script; verification checks; active slice selection; cut scope list. |
| Unnamed Group 9 | Local persistence; save status; load saved session on refresh. |

## Step 3 — Named Chunks

| Chunk | Stable Name | Includes | Biggest Uncertainty |
|---|---|---|---|
| CH1 | Session Shell | App shell, title/outcome, empty state, setup instructions. | How much guidance can be shown without turning the product into onboarding copy? |
| CH2 | Intent Capture | Typed transcript, optional dictation, shaping history. | Browser dictation reliability. |
| CH3 | Editable Canvas | Spatial canvas, typed cards, drag/select/manual creation. | How much canvas interaction is enough for V1 without a canvas library? |
| CH4 | Blueprint Inspector | Card type/content/status editing. | How to keep editing simple but still structured. |
| CH5 | AI Structuring Loop | Shape turn, prompt builder, AI call, operation validation/reducer. | AI operation reliability. |
| CH6 | Questions / Risks / Slices | AI questions, risks, assumptions, starter slices. | Whether starter slices are useful without over-automating shaping. |
| CH7 | Relationships | Connectors and relationship types. | Whether connectors need direct manual editing in V1. |
| CH8 | Build Contract Export | Preview, copy/download, non-goals, demo, verification, active slice. | Minimum export structure Codex needs. |
| CH9 | Local Continuity | Persistence, save status, load on refresh. | Data loss risk if local storage format changes. |

## Biggest Spike

| Spike | Reason |
|---|---|
| `spike-export-contract.md` | The output must become a build contract; if the export is weak, the whole product collapses into a visual note tool. |

---

# Scope Cut

## In Scope This Cycle

| Item | Scope |
|---|---|
| SC1 | One local web app |
| SC2 | Single user / single session |
| SC3 | Typed text input as primary idea capture |
| SC4 | Optional browser dictation if low-cost |
| SC5 | Draggable typed cards |
| SC6 | AI-generated cards/connectors/questions/slices through a single Shape turn action |
| SC7 | Manual card creation and editing |
| SC8 | Local persistence |
| SC9 | Markdown export packet for Codex |
| SC10 | Three demoable vertical slices |

## Cut / Not This Cycle

| Item | Cut Reason |
|---|---|
| CUT1 | Miro SDK / Miro board integration | Too much platform scope for non-technical V1. |
| CUT2 | Miro MCP / GitHub automation | Handoff can happen through copy/download first. |
| CUT3 | Multiplayer presence | Not needed to validate solo builder use case. |
| CUT4 | Real-time voice-to-voice AI teammate | Browser dictation or typed input proves the capture path first. |
| CUT5 | AI cursor that moves and edits like a collaborator | Defensible later, but not required for V1 proof. |
| CUT6 | High-fidelity UI mockups | Violates the low-fidelity shaping requirement. |
| CUT7 | Auth/accounts/cloud sync | Adds setup and privacy complexity. |
| CUT8 | File uploads and image understanding | Useful later; not needed for idea-in → blueprint-out demo. |
| CUT9 | Automatic repo creation or Codex execution | Export packet is enough for V1 handoff. |

---

# Slice Sequencing

## Pass 1 — Dependency Order

| Order | Slice | Depends On | Dependency Reason |
|---:|---|---|---|
| 1 | S1: Manual Blueprint Canvas | None | Creates the app shell, state model, typed cards, editing, and persistence that later AI operations will update. |
| 2 | S2: AI Shape Turn | S1 | Needs existing transcript/card/state model before AI can safely add or update structured cards. |
| 3 | S3: Codex Build Contract Export | S1, S2 | Needs cards, connectors, slices, and questions to compose a useful packet. |

## Pass 2 — Unknowns Order

| Starter | Unknown Pull | Decision |
|---|---|---|
| S1 | Canvas complexity and local persistence are the earliest build risks. | Keep S1 first. |
| S2 | AI operation reliability is the biggest unknown, but S2 is blocked until S1 defines cards/state. | Pull S2 immediately after S1. |
| S3 | Export usefulness is the biggest product-risk spike, but it requires actual blueprint state. | Keep S3 third; verify with the Codex packet. |

## Blocked Slices

| Slice | Blocked? | Reason |
|---|---:|---|
| S1 | No | Can be built without AI or external services. |
| S2 | No after S1 | Needs S1 data structures; then can be built. |
| S3 | No after S1/S2 | Needs blueprint state and candidate slices. |

---

# Slice Definitions

## S1: Manual Blueprint Canvas

| Field | Definition |
|---|---|
| Goal | Validate the spatial, typed, editable blueprint surface without AI. |
| Included Places | P1, P1.1, P1.2, P1.3, P3 |
| Included UI | U1, U2, U6, U7, U8, U9, U10, U11, U15 |
| Included Code | C1, C3, C8, C9, C10, C13, C14 |
| Included Data | D1, D2, D3, D4, D8, D10 |
| Produces | A saved local shaping session with a title, transcript, draggable typed cards, editable card details, and refresh-safe state. |
| Excludes | AI structuring, dictation, export packet, generated slices, copy/download. |

### S1 Demo Script

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

### S1 Verification Plan

| Check | Verification |
|---|---|
| VP1 | App can be opened locally and shows the three-lane layout. |
| VP2 | Manual card creation works. |
| VP3 | Card selection and inspector editing work. |
| VP4 | Card drag updates position. |
| VP5 | Refresh restores session state from local storage. |
| VP6 | No external AI/API key is required for S1. |

## S2: AI Shape Turn

| Field | Definition |
|---|---|
| Goal | Validate that a plain-language idea turn can become structured cards, connectors, questions, and candidate slices. |
| Included Places | P1, P1.1, P1.2, P1.4, P2, P5 optional |
| Included UI | U3, U4, U5, U6, U7, U8, U14, U15 |
| Included Code | C2 optional, C4, C5, C6, C7, C11, C13, C15 |
| Included Data | D2, D3, D4, D5, D6, D8, D9, D10 |
| Produces | A shaped turn that adds or updates typed canvas cards, connectors, AI questions/risks, and at least one candidate slice. |
| Excludes | Final export packet copy/download; Miro integration; realtime voice-to-voice. |

### S2 Demo Script

| Step | Action | Expected Behavior |
|---:|---|---|
| 1 | Start from the saved S1 session. | Existing title/transcript/cards load. |
| 2 | Type or dictate a new idea turn: “I want an app where users drop rough product ideas and get requirements, screens, flows, risks, and first build slice.” | Transcript records the turn. |
| 3 | Click Shape turn. | App shows loading / working state. |
| 4 | Wait for AI response. | Canvas adds typed cards such as requirement, place, user action, data object, risk, question, slice. |
| 5 | Inspect generated cards. | Selected card can still be edited manually. |
| 6 | Review questions/risks panel. | AI questions or assumptions are visible. |
| 7 | Refresh the browser. | AI-generated cards/questions/slices remain. |
| 8 | Produces: | A mixed manual + AI structured blueprint that can be exported in S3. |

### S2 Verification Plan

| Check | Verification |
|---|---|
| VP1 | Shape turn reads current transcript and blueprint state. |
| VP2 | AI response is validated before state changes. |
| VP3 | Invalid AI response shows a user-visible error without corrupting existing cards. |
| VP4 | At least five typed cards can be generated from one product idea turn. |
| VP5 | At least one connector can be generated and rendered. |
| VP6 | AI-created cards remain editable through the same inspector as manual cards. |
| VP7 | Generated state persists after refresh. |

## S3: Codex Build Contract Export

| Field | Definition |
|---|---|
| Goal | Validate that the shaped blueprint becomes a readable, Codex-ready build contract for one selected slice. |
| Included Places | P1, P1.4, P4 |
| Included UI | U12, U13, U14, U15 |
| Included Code | C9, C11, C12, C13, C15 |
| Included Data | D1, D2, D3, D4, D5, D6, D7, D8, D9, D10 |
| Produces | A Markdown context packet that tells Codex what to build next, which IDs to preserve, what is excluded, and how to verify the slice. |
| Excludes | Automatic Codex execution, GitHub repo creation, PR creation, MCP handoff. |

### S3 Demo Script

| Step | Action | Expected Behavior |
|---:|---|---|
| 1 | Start from the S2 blueprint. | Canvas has typed cards, connectors, questions/risks, and at least one slice. |
| 2 | Open export lane. | Export packet preview appears. |
| 3 | Select the active slice from the slice checklist. | Export packet updates to focus on that slice. |
| 4 | Inspect packet preview. | Packet includes task, source artifacts, authority order, requirements, relevant cards/connectors, slice demo, verification, and non-goals. |
| 5 | Click copy/download. | Packet is copied to clipboard or downloaded as Markdown and status confirms success. |
| 6 | Paste packet into Codex. | Codex has a clear single-slice build request. |
| 7 | Produces: | A Codex-ready context packet for implementing the first vertical slice without overbuilding. |

### S3 Verification Plan

| Check | Verification |
|---|---|
| VP1 | Export packet includes active slice only, plus relevant surrounding context. |
| VP2 | Export packet preserves card IDs and slice IDs. |
| VP3 | Export packet includes non-goals/cut list. |
| VP4 | Export packet includes demo script with “Produces”. |
| VP5 | Copy/download gives the same visible content as the preview. |
| VP6 | A non-technical user can read the packet and understand what Codex is being asked to build. |

---

# Sliced Breadboard

## S1 Affordance Subset

| Kind | IDs |
|---|---|
| Places | P1, P1.1, P1.2, P1.3, P3 |
| UI | U1, U2, U6, U7, U8, U9, U10, U11, U15 |
| Code | C1, C3, C8, C9, C10, C13, C14 |
| Data | D1, D2, D3, D4, D8, D10 |

## S2 Affordance Subset

| Kind | IDs |
|---|---|
| Places | P1, P1.1, P1.2, P1.4, P2, P5 optional |
| UI | U3, U4, U5, U6, U7, U8, U14, U15 |
| Code | C2 optional, C4, C5, C6, C7, C11, C13, C15 |
| Data | D2, D3, D4, D5, D6, D8, D9, D10 |

## S3 Affordance Subset

| Kind | IDs |
|---|---|
| Places | P1, P1.4, P4 |
| UI | U12, U13, U14, U15 |
| Code | C9, C11, C12, C13, C15 |
| Data | D1, D2, D3, D4, D5, D6, D7, D8, D9, D10 |

---

# Ripple Check

| Artifact / Area | Update Needed? | Status |
|---|---:|---|
| shaping.md | Yes | Slices reflect selected Shape A and breadboard IDs. |
| requirements list/table | No | No new requirements added from slicing. |
| shape parts/mechanisms | No | A1–A7 preserved. |
| CURRENT and/or Detail X | No | No changes. |
| both fit checks | No | Selected shape still passes. |
| Unknowns / spikes | Yes | UQ1 maps to S3 verification; UQ2/UQ3 map to S2 verification. |
| breadboard tables + wiring table + Mermaid diagram | No | Slices reference existing affordance IDs. |
| slices.md | Yes | This file is slice source of truth. |
| slice definitions and sequencing | Yes | S1–S3 defined. |
| slice plan files | Yes | `codex-context-packet.md` generated for S1 handoff. |
