# Project Latitude V1.0 — Non-Technical Codex Handoff

This folder turns the Project Latitude idea into a V1.0 planning packet you can hand to Codex.

## What V1.0 is

A small local web app where a builder can:

1. type or dictate a rough product idea,
2. turn it into typed cards on a spatial canvas,
3. inspect/edit the blueprint,
4. export a Markdown context packet for Codex.

## What to build first

Build **Slice S1 only**:

> Manual Blueprint Canvas: app shell, transcript input, draggable typed cards, inspector editing, and local persistence.

S1 does **not** need AI or an API key.

## Files

| File | Use |
|---|---|
| `shaping.md` | Source of truth for requirements, selected shape, fit checks, and breadboard. |
| `slices.md` | Source of truth for S1/S2/S3 slice scope and demo scripts. |
| `spike-export-contract.md` | Spike for the later Codex export contract. |
| `codex-context-packet.md` | Paste this into Codex to build S1. |

## How to use with Codex

1. Create an empty repo or project folder.
2. Add these Markdown files.
3. Open Codex.
4. Paste the hand-off prompt from `codex-context-packet.md`.
5. Tell Codex: **“Build S1 only. Do not implement S2 or S3.”**
6. Run the S1 demo script from `slices.md`.
7. Only after S1 passes, ask Codex to continue to S2.

## V1 Sequence

| Slice | Build When | Outcome |
|---|---|---|
| S1 | First | Manual editable shaping canvas with local save. |
| S2 | After S1 passes | AI Shape turn generates typed cards/questions/slices. |
| S3 | After S2 passes | Export a Codex-ready build contract. |

## Cut Scope

Do not build Miro integration, multiplayer, auth, high-fidelity mockups, MCP, GitHub automation, or automatic Codex execution in V1.
