const CARD_TYPES = [
  "requirement",
  "place",
  "action",
  "rule",
  "data",
  "risk",
  "question",
  "slice",
  "acceptance",
];
const CARD_STATUSES = ["draft", "accepted", "question", "risk", "cut"];
const RELATIONS = ["flow", "depends-on", "satisfies", "blocks", "belongs-to"];

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "operations", "questions", "risks", "slices"],
  properties: {
    summary: { type: "string" },
    operations: {
      type: "array",
      maxItems: 14,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind"],
        properties: {
          kind: { type: "string", enum: ["add_card", "update_card", "add_connector"] },
          clientId: { type: "string" },
          cardId: { type: "string" },
          type: { type: "string", enum: CARD_TYPES },
          title: { type: "string" },
          body: { type: "string" },
          status: { type: "string", enum: CARD_STATUSES },
          x: { type: "number" },
          y: { type: "number" },
          from: { type: "string" },
          relation: { type: "string", enum: RELATIONS },
          to: { type: "string" },
        },
      },
    },
    questions: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
    risks: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
    slices: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "summary", "cardIds", "demoSteps", "verificationChecks"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          cardIds: {
            type: "array",
            maxItems: 10,
            items: { type: "string" },
          },
          demoSteps: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
          verificationChecks: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
          status: { type: "string", enum: ["candidate", "active", "accepted"] },
        },
      },
    },
  },
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function titleFromPayload(payload) {
  const title = asString(payload?.meta?.title);
  const outcome = asString(payload?.meta?.outcome);
  const transcriptWords = asString(payload?.transcript).split(/\s+/).slice(0, 7).join(" ");
  return title || outcome || transcriptWords || "Untitled product idea";
}

function buildLocalDraft(payload) {
  const title = titleFromPayload(payload);
  const idea = asString(payload?.transcript, "A rough product idea that needs a first implementation slice.");
  const existingCards = asArray(payload?.cards);
  const offset = Math.min(180, existingCards.length * 18);
  const prefix = `agent-${Date.now()}`;

  return {
    provider: "local-draft",
    summary: `Drafted a canvas-native shaping pass for ${title}: requirements, workspace, action, data, risk, question, slice, and acceptance structure.`,
    operations: [
      {
        kind: "add_card",
        clientId: `${prefix}-req`,
        type: "requirement",
        title: "Visible structured intent",
        body: `A builder should describe an idea in plain language and see editable product structure on the canvas. Source idea: ${idea}`,
        status: "draft",
        x: 72 + offset,
        y: 80,
      },
      {
        kind: "add_card",
        clientId: `${prefix}-place`,
        type: "place",
        title: "Co-creation canvas",
        body: "The main workspace shows input/history, typed cards, relationships, and an inspector without switching tools.",
        status: "draft",
        x: 366 + offset,
        y: 84,
      },
      {
        kind: "add_card",
        clientId: `${prefix}-action`,
        type: "action",
        title: "Shape with agent",
        body: "The user asks the agent to propose operations, then keeps full control by editing the generated cards.",
        status: "accepted",
        x: 660 + offset,
        y: 108,
      },
      {
        kind: "add_card",
        clientId: `${prefix}-data`,
        type: "data",
        title: "Blueprint payload",
        body: "Project meta, transcript, typed cards, connectors, questions, risks, slices, and export text form the working contract.",
        status: "draft",
        x: 388 + offset,
        y: 306,
      },
      {
        kind: "add_card",
        clientId: `${prefix}-risk`,
        type: "risk",
        title: "Confident but wrong structure",
        body: "Agent output must stay draft and editable so the builder can correct shallow assumptions before implementation.",
        status: "risk",
        x: 96 + offset,
        y: 336,
      },
      {
        kind: "add_card",
        clientId: `${prefix}-question`,
        type: "question",
        title: "What is the first real user moment?",
        body: "Name the first moment where the product either creates clarity or fails to be useful.",
        status: "question",
        x: 682 + offset,
        y: 342,
      },
      {
        kind: "add_card",
        clientId: `${prefix}-slice`,
        type: "slice",
        title: "Agent canvas loop",
        body: "One agent turn turns transcript plus current blueprint into typed cards, connectors, questions, risks, and a candidate build slice.",
        status: "draft",
        x: 380 + offset,
        y: 542,
      },
      {
        kind: "add_card",
        clientId: `${prefix}-acceptance`,
        type: "acceptance",
        title: "Co-created state persists",
        body: "Agent-generated cards, connectors, questions, risks, and slice details survive refresh and remain manually editable.",
        status: "draft",
        x: 682 + offset,
        y: 560,
      },
      { kind: "add_connector", from: `${prefix}-req`, relation: "satisfies", to: `${prefix}-place` },
      { kind: "add_connector", from: `${prefix}-place`, relation: "flow", to: `${prefix}-action` },
      { kind: "add_connector", from: `${prefix}-action`, relation: "depends-on", to: `${prefix}-data` },
      { kind: "add_connector", from: `${prefix}-risk`, relation: "blocks", to: `${prefix}-slice` },
      { kind: "add_connector", from: `${prefix}-slice`, relation: "satisfies", to: `${prefix}-acceptance` },
    ],
    questions: [
      "Which user segment should the first slice serve?",
      "What existing workflow does this replace or improve?",
      "Which card should be treated as the first non-negotiable requirement?",
    ],
    risks: [
      "The agent may generate a plausible blueprint before the actual user problem is sharp.",
      "A single-user local canvas proves the loop but not shared review or collaboration.",
    ],
    slices: [
      {
        id: createId("slice"),
        title: "Agent canvas loop",
        summary:
          "Validate that the agent can co-create low-fidelity structure directly on the canvas while the user remains in control.",
        cardIds: [
          `${prefix}-req`,
          `${prefix}-place`,
          `${prefix}-action`,
          `${prefix}-data`,
          `${prefix}-slice`,
          `${prefix}-acceptance`,
        ],
        demoSteps: [
          "Enter a rough product idea.",
          "Click Shape with agent.",
          "Confirm typed cards and connector lines appear.",
          "Edit an agent-created card in the inspector.",
          "Refresh and confirm the co-created blueprint persists.",
        ],
        verificationChecks: [
          "The agent turn reads transcript and current canvas state.",
          "At least five typed cards are generated.",
          "At least one connector is generated and rendered.",
          "Generated cards remain editable.",
          "Generated questions, risks, and slice persist after refresh.",
        ],
        status: "candidate",
      },
    ],
  };
}

function buildPrompt(payload) {
  const cards = asArray(payload.cards)
    .slice(0, 40)
    .map((card) => ({
      id: card.id,
      type: card.type,
      title: card.title,
      body: card.body,
      status: card.status,
    }));
  const connectors = asArray(payload.connectors)
    .slice(0, 40)
    .map((connector) => ({
      id: connector.id,
      from: connector.from,
      relation: connector.relation,
      to: connector.to,
    }));
  const slices = asArray(payload.slices)
    .slice(0, 12)
    .map((slice) => ({
      id: slice.id,
      title: slice.title,
      summary: slice.summary,
      cardIds: slice.cardIds,
      status: slice.status,
    }));

  return JSON.stringify(
    {
      project: payload.meta ?? {},
      transcript: asString(payload.transcript),
      currentBlueprint: { cards, connectors, slices },
      instruction:
        "Act as a canvas-native product shaping agent. Return only operations that preserve user control: add typed cards, update obvious stale cards only when useful, add connector relationships, list questions/risks, and propose one or two candidate vertical slices. Keep artifacts low-fidelity and implementation-ready. Prefer 5 to 9 cards for an empty canvas. Use clientId for new cards so connectors and slice cardIds can reference them.",
    },
    null,
    2,
  );
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  for (const item of asArray(data?.output)) {
    for (const content of asArray(item?.content)) {
      if (typeof content?.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function validateResult(result) {
  if (!result || typeof result !== "object" || !Array.isArray(result.operations)) {
    throw new Error("Model returned an invalid operation packet.");
  }

  return {
    provider: result.provider === "local-draft" ? "local-draft" : "openai",
    summary: asString(result.summary, "Agent shaped the current turn."),
    operations: result.operations,
    questions: asArray(result.questions).filter((item) => typeof item === "string").slice(0, 8),
    risks: asArray(result.risks).filter((item) => typeof item === "string").slice(0, 8),
    slices: asArray(result.slices).slice(0, 5),
  };
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for shape turns." });
    return;
  }

  try {
    const payload = await readBody(req);

    if (!process.env.OPENAI_API_KEY) {
      res.status(200).json(buildLocalDraft(payload));
      return;
    }

    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          "You are Project Latitude's shaping agent. You co-create by returning structured canvas operations, not prose. Never remove user work. Keep output low-fidelity, typed, and directly editable.",
        input: buildPrompt(payload),
        text: {
          format: {
            type: "json_schema",
            name: "latitude_shape_turn",
            schema: responseSchema,
            strict: false,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(502).json({ error: `OpenAI request failed: ${errorText.slice(0, 500)}` });
      return;
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    const parsed = outputText ? JSON.parse(outputText) : data;
    res.status(200).json(validateResult(parsed));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Shape turn failed.",
    });
  }
}
