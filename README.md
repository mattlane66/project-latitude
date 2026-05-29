# Project Latitude 2.1.0

Project Latitude is a local, canvas-native shaping workspace for turning rough product intent into typed, editable build structure. The 2.1.0 slice adds the core co-creation loop: a shaping agent reads the transcript plus the current canvas and returns validated operations for cards, connectors, questions, risks, and candidate slices.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Agent API

The app calls `POST /api/shape-turn`.

- On Vercel, set `OPENAI_API_KEY` to use the OpenAI Responses API with structured JSON output.
- `OPENAI_MODEL` is optional and defaults to `gpt-5-mini`.
- If no API key is present, the route returns a deterministic local draft agent result so the canvas loop remains demoable without secrets.
- In plain Vite local dev, the browser falls back to the same local draft agent when the Vercel API route is not running.

## 2.1 Demo Path

1. Open the app.
2. Enter a project title and target outcome.
3. Type or paste a rough product idea into the working transcript.
4. Click **Shape with agent**.
5. Confirm typed cards, connector lines, questions, risks, and a candidate slice appear.
6. Select an agent-created card and edit type, title, body, status, or relationships.
7. Inspect the build contract preview and copy or download it.
8. Refresh and confirm the co-created blueprint persists.

Planning source artifacts are copied into `docs/planning/`.
