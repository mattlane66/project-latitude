---
shaping: true
artifact_type: spike
status: draft-v1.0
---

# spike-export-contract.md

## Context

Project Latitude V1 must turn a shaped canvas into a **build contract** that a coding agent can use. The user is non-technical, so the export cannot require them to understand a large JSON schema or hand-edit implementation details.

The selected shape depends on A6: an export composer that turns requirements, typed cards, relationships, slices, demo scripts, verification checks, and non-goals into a Codex-ready Markdown packet.

## What We Need To Learn

We need to learn what minimum export structure gives Codex enough context to build the next slice without making the V1 product heavy or schema-first.

## Questions Table

| # | Question | Why it matters |
|---|---|---|
| SQ1 | What fields must every typed card have so Codex can reconstruct the blueprint? | Prevents the export from becoming vague prose. |
| SQ2 | Should the export be Markdown, JSON, or a hybrid? | A non-technical user needs readability; Codex needs structure. |
| SQ3 | How should relationships between cards be represented without making the UI complex? | Relationships are the canvas advantage; losing them collapses the product into chat. |
| SQ4 | What slice information must be included for Codex to build only one vertical slice? | Prevents Codex from over-building the whole product. |
| SQ5 | How can the export preserve non-goals and cuts so Codex does not expand scope? | Vibe coding risk: agents tend to “helpfully” add features. |

## Options

| Option | Description | Pros | Cons |
|---|---|---|---|
| O1 | Markdown only | Human-readable, easiest to inspect and paste into Codex. | Relationships and card types can become ambiguous. |
| O2 | JSON only | Machine-readable and stable. | Non-technical user cannot easily inspect or trust it. |
| O3 | Hybrid Markdown with lightweight structured blocks | Human-readable sections plus compact card/connector/slice lists. | Slightly more design work than pure Markdown. |
| O4 | Full formal schema | Strong validation and future interoperability. | Too heavy for V1; risks building infrastructure instead of the product demo. |

## Tradeoffs

| Tradeoff | O1 Markdown | O2 JSON | O3 Hybrid | O4 Full schema |
|---|---:|---:|---:|---:|
| Non-technical readability | ✅ | ❌ | ✅ | ❌ |
| Codex structure | ❌ | ✅ | ✅ | ✅ |
| Easy V1 implementation | ✅ | ✅ | ✅ | ❌ |
| Preserves relationships | ❌ | ✅ | ✅ | ✅ |
| Avoids over-engineering | ✅ | ✅ | ✅ | ❌ |
| Future extensibility | ❌ | ✅ | ✅ | ✅ |

## Recommendation for V1

Use **O3: Hybrid Markdown with lightweight structured blocks**.

The export should contain:

| Section | Purpose |
|---|---|
| Task | Tell Codex exactly which slice to build now. |
| Source artifacts | Name Project Latitude V1 as the shaping source. |
| Authority order | Prevent raw notes or rejected ideas from overriding selected scope. |
| Requirements | Include R0–R8, but only the ones relevant to the active slice need to be highlighted. |
| Selected shape | Include A and the active A-parts. |
| Card list | Include card ID, type, title, body, and status. |
| Connector list | Include from-card, relation, to-card. |
| Slice | Include included affordance IDs, demo script, produces line, exclusions, and verification plan. |
| Non-goals | Keep cuts close to the build request. |
| Required agent behavior | Tell Codex to propose a plan before editing and to ask at most three blocking questions. |

## Acceptance Criteria = Knowledge Gained

The spike is complete when we can describe:

| # | Knowledge gained |
|---|---|
| AC1 | The minimum card fields that must appear in the export. |
| AC2 | The minimum connector fields that must appear in the export. |
| AC3 | The minimum slice fields that prevent Codex from building too much. |
| AC4 | Whether the hybrid Markdown export is readable enough for a non-technical user to inspect before sending. |
| AC5 | Whether Codex can use the packet to build Slice 1 without needing the whole shaping document. |

## Impact on shaping.md

| Item | Update |
|---|---|
| A6 | Keep export composer as selected mechanism. |
| R4 | Passes for V1 because the build contract is a hybrid Markdown packet with typed card and slice lists. |
| UQ1 | Remains a verification target during Slice 3, not a blocker for Slice 1. |

## Ripple Check

| Artifact / Area | Update Needed? | Status |
|---|---:|---|
| shaping.md | Yes | A6, R4, UQ1 referenced. |
| requirements list/table | No | Existing R4 already covers export contract. |
| shape parts/mechanisms | No | A6 remains valid. |
| both fit checks | Yes | A6 passes R4 using O3. |
| Unknowns / spikes | Yes | This spike documents UQ1. |
| breadboard tables + wiring table + Mermaid diagram | Yes | C11, C12, D7 cover the export composer. |
| slices.md | Yes | Slice 3 verifies export usefulness. |
| slice definitions and sequencing | Yes | Slice 3 includes export packet demo. |
| slice plan files | Yes | `codex-context-packet.md` uses the recommended hybrid packet shape. |
