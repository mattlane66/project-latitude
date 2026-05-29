import {
  AlertTriangle,
  Bot,
  Check,
  ClipboardCopy,
  Download,
  Link2,
  MousePointer2,
  Network,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const STORAGE_KEY = "project-latitude:v2.1:session";
const LEGACY_STORAGE_KEYS = ["project-latitude:v1:s1-session"];
const CARD_WIDTH = 244;
const CARD_HEIGHT = 156;

type CardType =
  | "requirement"
  | "place"
  | "action"
  | "rule"
  | "data"
  | "risk"
  | "question"
  | "slice"
  | "acceptance";

type CardStatus = "draft" | "accepted" | "question" | "risk" | "cut";
type ConnectorRelation = "flow" | "depends-on" | "satisfies" | "blocks" | "belongs-to";
type SliceStatus = "candidate" | "active" | "accepted";
type AgentProvider = "openai" | "local-draft" | "unknown";

type BlueprintCard = {
  id: string;
  type: CardType;
  title: string;
  body: string;
  status: CardStatus;
  x: number;
  y: number;
};

type Connector = {
  id: string;
  from: string;
  relation: ConnectorRelation;
  to: string;
};

type BlueprintSlice = {
  id: string;
  title: string;
  summary: string;
  cardIds: string[];
  demoSteps: string[];
  verificationChecks: string[];
  status: SliceStatus;
};

type AgentSnapshot = {
  summary: string;
  questions: string[];
  risks: string[];
  provider: AgentProvider;
  lastRunAt: string | null;
};

type SessionState = {
  meta: {
    sessionId: string;
    title: string;
    outcome: string;
  };
  transcript: string;
  cards: BlueprintCard[];
  connectors: Connector[];
  slices: BlueprintSlice[];
  selectedCardId: string | null;
  selectedSliceId: string | null;
  agent: AgentSnapshot;
};

type AgentOperation = {
  kind: "add_card" | "update_card" | "add_connector";
  clientId?: string;
  cardId?: string;
  type?: CardType;
  title?: string;
  body?: string;
  status?: CardStatus;
  x?: number;
  y?: number;
  from?: string;
  relation?: ConnectorRelation;
  to?: string;
};

type AgentSliceDraft = {
  id?: string;
  title: string;
  summary: string;
  cardIds: string[];
  demoSteps: string[];
  verificationChecks: string[];
  status?: SliceStatus;
};

type AgentTurnResult = {
  summary: string;
  provider?: AgentProvider;
  operations: AgentOperation[];
  questions: string[];
  risks: string[];
  slices: AgentSliceDraft[];
};

type DragState = {
  cardId: string;
  offsetX: number;
  offsetY: number;
};

const cardTypes: CardType[] = [
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

const statuses: CardStatus[] = ["draft", "accepted", "question", "risk", "cut"];
const sliceStatuses: SliceStatus[] = ["candidate", "active", "accepted"];
const relations: ConnectorRelation[] = ["flow", "depends-on", "satisfies", "blocks", "belongs-to"];

const typeLabels: Record<CardType, string> = {
  requirement: "Requirement",
  place: "Place / screen",
  action: "User action",
  rule: "System rule",
  data: "Data object",
  risk: "Risk",
  question: "Open question",
  slice: "Slice",
  acceptance: "Acceptance check",
};

const relationLabels: Record<ConnectorRelation, string> = {
  flow: "flow",
  "depends-on": "depends on",
  satisfies: "satisfies",
  blocks: "blocks",
  "belongs-to": "belongs to",
};

const providerLabels: Record<AgentProvider, string> = {
  openai: "OpenAI agent",
  "local-draft": "Local draft agent",
  unknown: "Agent ready",
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyAgent(): AgentSnapshot {
  return {
    summary: "",
    questions: [],
    risks: [],
    provider: "unknown",
    lastRunAt: null,
  };
}

function createEmptySession(): SessionState {
  return {
    meta: {
      sessionId: createId("session"),
      title: "",
      outcome: "",
    },
    transcript: "",
    cards: [],
    connectors: [],
    slices: [],
    selectedCardId: null,
    selectedSliceId: null,
    agent: createEmptyAgent(),
  };
}

function isCardType(value: unknown): value is CardType {
  return typeof value === "string" && cardTypes.includes(value as CardType);
}

function isCardStatus(value: unknown): value is CardStatus {
  return typeof value === "string" && statuses.includes(value as CardStatus);
}

function isSliceStatus(value: unknown): value is SliceStatus {
  return typeof value === "string" && sliceStatuses.includes(value as SliceStatus);
}

function isConnectorRelation(value: unknown): value is ConnectorRelation {
  return typeof value === "string" && relations.includes(value as ConnectorRelation);
}

function limitString(value: unknown, fallback = "", maxLength = 900) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().slice(0, maxLength);
}

function toStringList(value: unknown, maxItems = 8) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => limitString(item, "", 360))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeSession(value: unknown): SessionState {
  if (!value || typeof value !== "object") {
    return createEmptySession();
  }

  const saved = value as Partial<SessionState>;
  const rawCards = Array.isArray(saved.cards) ? (saved.cards as unknown[]) : [];
  const cards = rawCards
    .filter((card): card is Record<string, unknown> => Boolean(card && typeof card === "object"))
    .map((card, index) => ({
      id: typeof card.id === "string" ? card.id : createId("card"),
      type: isCardType(card.type) ? card.type : "requirement",
      title: typeof card.title === "string" ? card.title : `Card ${index + 1}`,
      body: typeof card.body === "string" ? card.body : "",
      status: isCardStatus(card.status) ? card.status : "draft",
      x: typeof card.x === "number" ? card.x : 80 + index * 24,
      y: typeof card.y === "number" ? card.y : 80 + index * 24,
    }));

  const cardIds = new Set(cards.map((card) => card.id));
  const connectors = Array.isArray(saved.connectors)
    ? saved.connectors.filter(
        (connector): connector is Connector =>
          Boolean(
            connector &&
              typeof connector === "object" &&
              typeof connector.id === "string" &&
              typeof connector.from === "string" &&
              typeof connector.to === "string" &&
              isConnectorRelation((connector as Connector).relation) &&
              cardIds.has(connector.from) &&
              cardIds.has(connector.to),
          ),
      )
    : [];

  const rawSlices = Array.isArray(saved.slices) ? (saved.slices as unknown[]) : [];
  const slices = rawSlices
    .filter((slice): slice is Record<string, unknown> => Boolean(slice && typeof slice === "object"))
    .map((slice, index) => ({
      id: typeof slice.id === "string" ? slice.id : createId("slice"),
      title: limitString(slice.title, `Slice ${index + 1}`, 120),
      summary: limitString(slice.summary, "", 700),
      cardIds: Array.isArray(slice.cardIds)
        ? slice.cardIds.filter((id): id is string => typeof id === "string" && cardIds.has(id))
        : [],
      demoSteps: toStringList(slice.demoSteps, 8),
      verificationChecks: toStringList(slice.verificationChecks, 8),
      status: isSliceStatus(slice.status) ? slice.status : "candidate",
    }));

  const sliceIds = new Set(slices.map((slice) => slice.id));
  const selectedCardId =
    typeof saved.selectedCardId === "string" && cardIds.has(saved.selectedCardId)
      ? saved.selectedCardId
      : null;
  const selectedSliceId =
    typeof saved.selectedSliceId === "string" && sliceIds.has(saved.selectedSliceId)
      ? saved.selectedSliceId
      : slices[0]?.id ?? null;

  const savedAgent = saved.agent && typeof saved.agent === "object" ? saved.agent : createEmptyAgent();

  return {
    meta: {
      sessionId:
        saved.meta && typeof saved.meta.sessionId === "string"
          ? saved.meta.sessionId
          : createId("session"),
      title: saved.meta && typeof saved.meta.title === "string" ? saved.meta.title : "",
      outcome: saved.meta && typeof saved.meta.outcome === "string" ? saved.meta.outcome : "",
    },
    transcript: typeof saved.transcript === "string" ? saved.transcript : "",
    cards,
    connectors,
    slices,
    selectedCardId,
    selectedSliceId,
    agent: {
      summary: limitString(savedAgent.summary, "", 900),
      questions: toStringList(savedAgent.questions, 8),
      risks: toStringList(savedAgent.risks, 8),
      provider:
        savedAgent.provider === "openai" || savedAgent.provider === "local-draft"
          ? savedAgent.provider
          : "unknown",
      lastRunAt: typeof savedAgent.lastRunAt === "string" ? savedAgent.lastRunAt : null,
    },
  };
}

function loadSession() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return normalizeSession(JSON.parse(saved));
    }

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy) {
        return normalizeSession(JSON.parse(legacy));
      }
    }

    return createEmptySession();
  } catch {
    return createEmptySession();
  }
}

function formatStatusTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function updateCard(cards: BlueprintCard[], cardId: string, changes: Partial<BlueprintCard>) {
  return cards.map((card) => (card.id === cardId ? { ...card, ...changes } : card));
}

function validateAgentResult(value: unknown): AgentTurnResult {
  if (!value || typeof value !== "object") {
    throw new Error("Agent response was empty.");
  }

  const result = value as Partial<AgentTurnResult>;
  if (!Array.isArray(result.operations)) {
    throw new Error("Agent response did not include canvas operations.");
  }

  return {
    summary: limitString(result.summary, "Agent shaped the current turn.", 900),
    provider:
      result.provider === "openai" || result.provider === "local-draft" ? result.provider : "unknown",
    operations: result.operations.filter(
      (operation): operation is AgentOperation =>
        Boolean(
          operation &&
            typeof operation === "object" &&
            (operation.kind === "add_card" ||
              operation.kind === "update_card" ||
              operation.kind === "add_connector"),
        ),
    ),
    questions: toStringList(result.questions, 8),
    risks: toStringList(result.risks, 8),
    slices: Array.isArray(result.slices)
      ? result.slices
          .filter((slice): slice is AgentSliceDraft =>
            Boolean(slice && typeof slice === "object" && typeof slice.title === "string"),
          )
          .slice(0, 5)
      : [],
  };
}

function applyAgentResult(current: SessionState, rawResult: AgentTurnResult): SessionState {
  const result = validateAgentResult(rawResult);
  const cardIdMap = new Map<string, string>();
  const nextCards = [...current.cards];
  const now = new Date().toISOString();
  const addedCardIds: string[] = [];

  for (const operation of result.operations) {
    if (operation.kind === "add_connector") {
      continue;
    }

    if (operation.kind === "add_card") {
      if (!isCardType(operation.type)) {
        throw new Error("Agent tried to add a card with an unknown type.");
      }

      const index = nextCards.length;
      const id = createId("card");
      const x = typeof operation.x === "number" ? operation.x : 96 + (index % 4) * 46;
      const y = typeof operation.y === "number" ? operation.y : 88 + (index % 5) * 42;
      const card: BlueprintCard = {
        id,
        type: operation.type,
        title: limitString(operation.title, typeLabels[operation.type], 140),
        body: limitString(operation.body, "", 1100),
        status: isCardStatus(operation.status) ? operation.status : "draft",
        x: Math.max(16, Math.min(980, x)),
        y: Math.max(16, Math.min(720, y)),
      };

      if (operation.clientId) {
        cardIdMap.set(operation.clientId, id);
      }

      nextCards.push(card);
      addedCardIds.push(id);
      continue;
    }

    const existingIndex = nextCards.findIndex((card) => card.id === operation.cardId);
    if (existingIndex < 0) {
      throw new Error("Agent tried to update a card that is not on the canvas.");
    }

    const existing = nextCards[existingIndex];
    nextCards[existingIndex] = {
      ...existing,
      type: isCardType(operation.type) ? operation.type : existing.type,
      title: typeof operation.title === "string" ? limitString(operation.title, existing.title, 140) : existing.title,
      body: typeof operation.body === "string" ? limitString(operation.body, existing.body, 1100) : existing.body,
      status: isCardStatus(operation.status) ? operation.status : existing.status,
      x: typeof operation.x === "number" ? Math.max(16, Math.min(980, operation.x)) : existing.x,
      y: typeof operation.y === "number" ? Math.max(16, Math.min(720, operation.y)) : existing.y,
    };
  }

  const finalCardIds = new Set(nextCards.map((card) => card.id));
  const resolveCardRef = (value: unknown) => {
    if (typeof value !== "string") {
      return null;
    }

    return cardIdMap.get(value) ?? (finalCardIds.has(value) ? value : null);
  };

  const nextConnectors = [...current.connectors];
  for (const operation of result.operations) {
    if (operation.kind !== "add_connector") {
      continue;
    }

    const from = resolveCardRef(operation.from);
    const to = resolveCardRef(operation.to);
    if (!from || !to || from === to || !isConnectorRelation(operation.relation)) {
      throw new Error("Agent tried to add an invalid connector.");
    }

    const alreadyExists = nextConnectors.some(
      (connector) => connector.from === from && connector.to === to && connector.relation === operation.relation,
    );
    if (!alreadyExists) {
      nextConnectors.push({
        id: createId("connector"),
        from,
        relation: operation.relation,
        to,
      });
    }
  }

  const nextSlices = [...current.slices];
  const addedSliceIds: string[] = [];
  for (const draft of result.slices) {
    const id = draft.id && !nextSlices.some((slice) => slice.id === draft.id) ? draft.id : createId("slice");
    const slice: BlueprintSlice = {
      id,
      title: limitString(draft.title, "Candidate slice", 140),
      summary: limitString(draft.summary, "", 900),
      cardIds: Array.isArray(draft.cardIds)
        ? draft.cardIds
            .map((cardId) => resolveCardRef(cardId))
            .filter((cardId): cardId is string => Boolean(cardId))
        : addedCardIds.slice(0, 5),
      demoSteps: toStringList(draft.demoSteps, 8),
      verificationChecks: toStringList(draft.verificationChecks, 8),
      status: isSliceStatus(draft.status) ? draft.status : "candidate",
    };
    nextSlices.push(slice);
    addedSliceIds.push(id);
  }

  return {
    ...current,
    cards: nextCards,
    connectors: nextConnectors,
    slices: nextSlices,
    selectedCardId: addedCardIds[0] ?? current.selectedCardId,
    selectedSliceId: addedSliceIds[0] ?? current.selectedSliceId ?? nextSlices[0]?.id ?? null,
    agent: {
      summary: result.summary,
      questions: result.questions,
      risks: result.risks,
      provider: result.provider ?? "unknown",
      lastRunAt: now,
    },
  };
}

function titleFromSession(session: SessionState) {
  return (
    session.meta.title.trim() ||
    session.meta.outcome.trim() ||
    session.transcript.trim().split(/\s+/).slice(0, 7).join(" ") ||
    "Untitled product idea"
  );
}

function buildLocalAgentResult(session: SessionState): AgentTurnResult {
  const idea = session.transcript.trim() || "A rough product idea that needs shaping into a first slice.";
  const title = titleFromSession(session);
  const offset = Math.min(180, session.cards.length * 18);
  const prefix = `local-${Date.now()}`;

  const operations: AgentOperation[] = [
    {
      kind: "add_card",
      clientId: `${prefix}-req`,
      type: "requirement",
      title: "Clarify the core promise",
      body: `A user should be able to explain the idea in plain language and see a structured blueprint emerge. Source idea: ${idea}`,
      status: "draft",
      x: 72 + offset,
      y: 80,
    },
    {
      kind: "add_card",
      clientId: `${prefix}-place`,
      type: "place",
      title: "Shaping workspace",
      body: "A three-lane workspace keeps input/history, the spatial blueprint, and inspection/export visible at the same time.",
      status: "draft",
      x: 366 + offset,
      y: 84,
    },
    {
      kind: "add_card",
      clientId: `${prefix}-action`,
      type: "action",
      title: "Shape a turn with agent",
      body: "The builder clicks a single action and the agent proposes canvas operations instead of replacing the user's editable work.",
      status: "accepted",
      x: 660 + offset,
      y: 108,
    },
    {
      kind: "add_card",
      clientId: `${prefix}-data`,
      type: "data",
      title: "Blueprint session state",
      body: "Project meta, transcript, typed cards, connectors, questions, risks, slices, and export text persist locally.",
      status: "draft",
      x: 388 + offset,
      y: 306,
    },
    {
      kind: "add_card",
      clientId: `${prefix}-risk`,
      type: "risk",
      title: "Agent over-shapes too early",
      body: "Keep the output low-fidelity, editable, and explicitly marked as draft until the builder accepts it.",
      status: "risk",
      x: 96 + offset,
      y: 336,
    },
    {
      kind: "add_card",
      clientId: `${prefix}-question`,
      type: "question",
      title: "Who is the first builder?",
      body: "Decide whether the first demo is for solo founders, product leads, or agent-heavy internal teams.",
      status: "question",
      x: 682 + offset,
      y: 342,
    },
    {
      kind: "add_card",
      clientId: `${prefix}-slice`,
      type: "slice",
      title: "Slice 2.1: Agent canvas loop",
      body: "One agent turn reads the current transcript and blueprint, then adds typed cards, connectors, questions, risks, and a candidate slice.",
      status: "draft",
      x: 380 + offset,
      y: 542,
    },
    {
      kind: "add_card",
      clientId: `${prefix}-acceptance`,
      type: "acceptance",
      title: "Refresh-safe co-created blueprint",
      body: "After an agent turn, the generated cards, connectors, risks, questions, and slice remain editable and survive refresh.",
      status: "draft",
      x: 682 + offset,
      y: 560,
    },
    {
      kind: "add_connector",
      from: `${prefix}-req`,
      relation: "satisfies",
      to: `${prefix}-place`,
    },
    {
      kind: "add_connector",
      from: `${prefix}-place`,
      relation: "flow",
      to: `${prefix}-action`,
    },
    {
      kind: "add_connector",
      from: `${prefix}-action`,
      relation: "depends-on",
      to: `${prefix}-data`,
    },
    {
      kind: "add_connector",
      from: `${prefix}-risk`,
      relation: "blocks",
      to: `${prefix}-slice`,
    },
    {
      kind: "add_connector",
      from: `${prefix}-slice`,
      relation: "satisfies",
      to: `${prefix}-acceptance`,
    },
  ];

  return {
    provider: "local-draft",
    summary: `Drafted the minimum agent-canvas loop for ${title}: typed structure, visible relationships, open questions, risks, and one candidate build slice.`,
    operations,
    questions: [
      "What is the first real product idea we should shape on this canvas?",
      "Should the agent optimize for asking fewer better questions or generating more structure first?",
      "Which artifacts should be considered locked once the user accepts them?",
    ],
    risks: [
      "The agent could produce convincing structure before the core user problem is clear.",
      "A local-only session is fast to test but does not yet support sharing or multiplayer review.",
    ],
    slices: [
      {
        id: createId("slice"),
        title: "Agent canvas loop",
        summary:
          "Use a single shaping action to co-create an editable blueprint with typed cards, connectors, risks, questions, and acceptance checks.",
        cardIds: [
          `${prefix}-req`,
          `${prefix}-place`,
          `${prefix}-action`,
          `${prefix}-data`,
          `${prefix}-slice`,
          `${prefix}-acceptance`,
        ],
        demoSteps: [
          "Enter or paste a rough product idea.",
          "Click Shape with agent.",
          "Review the generated cards and connector lines.",
          "Select a generated card and edit it manually.",
          "Refresh and confirm the co-created blueprint persists.",
        ],
        verificationChecks: [
          "Agent turn reads the current transcript and existing canvas.",
          "At least five typed cards are produced.",
          "At least one connector is rendered.",
          "Generated cards remain editable in the inspector.",
          "Questions, risks, and candidate slice persist after refresh.",
        ],
        status: "candidate",
      },
    ],
  };
}

function composeExportPacket(session: SessionState) {
  const selectedSlice =
    session.slices.find((slice) => slice.id === session.selectedSliceId) ?? session.slices[0] ?? null;
  const relatedCardIds = new Set(selectedSlice?.cardIds ?? session.cards.map((card) => card.id));
  const cards = selectedSlice
    ? session.cards.filter((card) => relatedCardIds.has(card.id))
    : session.cards;
  const connectors = session.connectors.filter(
    (connector) => relatedCardIds.has(connector.from) && relatedCardIds.has(connector.to),
  );

  const lines = [
    `# ${session.meta.title.trim() || "Project Latitude Blueprint"}`,
    "",
    "## Task",
    selectedSlice
      ? `Implement the selected slice: ${selectedSlice.title}.`
      : "Shape the first implementation slice from this blueprint.",
    "",
    "## Outcome",
    session.meta.outcome.trim() || "Turn rough product intent into a typed, editable, buildable blueprint.",
    "",
    "## Latest Transcript",
    session.transcript.trim() || "_No transcript captured yet._",
    "",
    "## Agent Summary",
    session.agent.summary || "_No agent turn has run yet._",
    "",
    "## Questions",
    ...(session.agent.questions.length
      ? session.agent.questions.map((question) => `- ${question}`)
      : ["- None yet."]),
    "",
    "## Risks",
    ...(session.agent.risks.length ? session.agent.risks.map((risk) => `- ${risk}`) : ["- None yet."]),
    "",
    "## Canvas Cards",
    ...(cards.length
      ? cards.map(
          (card) =>
            `- ${card.id} [${typeLabels[card.type]} / ${card.status}] ${card.title}: ${card.body}`,
        )
      : ["- No cards yet."]),
    "",
    "## Connectors",
    ...(connectors.length
      ? connectors.map(
          (connector) =>
            `- ${connector.from} ${relationLabels[connector.relation]} ${connector.to}`,
        )
      : ["- No connectors yet."]),
    "",
    "## Selected Slice",
    selectedSlice ? `### ${selectedSlice.title}` : "_No slice selected._",
  ];

  if (selectedSlice) {
    lines.push(
      "",
      selectedSlice.summary,
      "",
      "### Demo Script",
      ...(selectedSlice.demoSteps.length
        ? selectedSlice.demoSteps.map((step, index) => `${index + 1}. ${step}`)
        : ["1. Run the shaped workflow end to end."]),
      "",
      "### Verification",
      ...(selectedSlice.verificationChecks.length
        ? selectedSlice.verificationChecks.map((check) => `- ${check}`)
        : ["- Verify the visible behavior matches the selected slice."]),
    );
  }

  lines.push(
    "",
    "## Non-goals",
    "- No multiplayer.",
    "- No Miro integration.",
    "- No automatic repo creation or deployment from this app.",
  );

  return lines.join("\n");
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while shaping the turn.";
}

export default function App() {
  const [session, setSession] = useState<SessionState>(() => loadSession());
  const [saveStatus, setSaveStatus] = useState("Loaded from browser storage");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isShaping, setIsShaping] = useState(false);
  const [agentError, setAgentError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [connectorTargetId, setConnectorTargetId] = useState("");
  const [connectorRelation, setConnectorRelation] = useState<ConnectorRelation>("flow");
  const boardRef = useRef<HTMLDivElement | null>(null);

  const selectedCard = useMemo(
    () => session.cards.find((card) => card.id === session.selectedCardId) ?? null,
    [session.cards, session.selectedCardId],
  );
  const selectedSlice = useMemo(
    () => session.slices.find((slice) => slice.id === session.selectedSliceId) ?? null,
    [session.slices, session.selectedSliceId],
  );
  const otherCards = useMemo(
    () => session.cards.filter((card) => card.id !== selectedCard?.id),
    [session.cards, selectedCard?.id],
  );
  const exportPacket = useMemo(() => composeExportPacket(session), [session]);

  useEffect(() => {
    setSaveStatus("Saving locally...");

    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setSaveStatus(`Saved locally ${formatStatusTime(new Date())}`);
      } catch {
        setSaveStatus("Save error");
      }
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [session]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const activeDrag = dragState;

    function moveCard(event: PointerEvent) {
      const board = boardRef.current;
      if (!board) {
        return;
      }

      const rect = board.getBoundingClientRect();
      const maxX = Math.max(16, rect.width - CARD_WIDTH - 16);
      const maxY = Math.max(16, rect.height - CARD_HEIGHT - 16);
      const x = Math.min(maxX, Math.max(16, event.clientX - rect.left - activeDrag.offsetX));
      const y = Math.min(maxY, Math.max(16, event.clientY - rect.top - activeDrag.offsetY));

      setSession((current) => ({
        ...current,
        cards: updateCard(current.cards, activeDrag.cardId, { x, y }),
      }));
    }

    function stopDragging() {
      setDragState(null);
    }

    window.addEventListener("pointermove", moveCard);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", moveCard);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragState]);

  useEffect(() => {
    if (!selectedCard || otherCards.some((card) => card.id === connectorTargetId)) {
      return;
    }

    setConnectorTargetId(otherCards[0]?.id ?? "");
  }, [connectorTargetId, otherCards, selectedCard]);

  function updateTitle(title: string) {
    setSession((current) => ({
      ...current,
      meta: { ...current.meta, title },
    }));
  }

  function updateOutcome(outcome: string) {
    setSession((current) => ({
      ...current,
      meta: { ...current.meta, outcome },
    }));
  }

  function updateTranscript(transcript: string) {
    setSession((current) => ({
      ...current,
      transcript,
    }));
  }

  function addCard(type: CardType = "requirement") {
    const count = session.cards.length;
    const card: BlueprintCard = {
      id: createId("card"),
      type,
      title: type === "slice" ? "New slice" : "New shaping card",
      body: "Describe the shaping artifact.",
      status: "draft",
      x: 72 + (count % 5) * 38,
      y: 72 + (count % 4) * 38,
    };

    setSession((current) => ({
      ...current,
      cards: [...current.cards, card],
      selectedCardId: card.id,
    }));
  }

  function selectCard(cardId: string) {
    setSession((current) => ({
      ...current,
      selectedCardId: cardId,
    }));
  }

  function editSelectedCard(changes: Partial<BlueprintCard>) {
    if (!selectedCard) {
      return;
    }

    setSession((current) => ({
      ...current,
      cards: updateCard(current.cards, selectedCard.id, changes),
    }));
  }

  function startDragging(event: ReactPointerEvent<HTMLElement>, card: BlueprintCard) {
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select")) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    const rect = board.getBoundingClientRect();
    selectCard(card.id);
    setDragState({
      cardId: card.id,
      offsetX: event.clientX - rect.left - card.x,
      offsetY: event.clientY - rect.top - card.y,
    });
  }

  async function shapeWithAgent() {
    if (!session.transcript.trim() && session.cards.length === 0) {
      setAgentError("Add a product idea or at least one card before asking the agent to shape.");
      return;
    }

    setIsShaping(true);
    setAgentError("");
    setCopyStatus("");

    try {
      const response = await fetch("/api/shape-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: session.meta,
          transcript: session.transcript,
          cards: session.cards,
          connectors: session.connectors,
          slices: session.slices,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Agent API returned ${response.status}.`);
      }

      const result = validateAgentResult(await response.json());
      setSession((current) => applyAgentResult(current, result));
    } catch (error) {
      const message = extractErrorMessage(error);
      const canUseLocalDraft =
        message.includes("Failed to fetch") ||
        message.includes("404") ||
        message.includes("Unexpected token") ||
        message.includes("NetworkError");

      if (!canUseLocalDraft) {
        setAgentError(message);
        return;
      }

      try {
        setSession((current) => applyAgentResult(current, buildLocalAgentResult(current)));
        setAgentError("Using the local draft agent because the API route is not available in this dev server.");
      } catch (fallbackError) {
        setAgentError(extractErrorMessage(fallbackError));
      }
    } finally {
      setIsShaping(false);
    }
  }

  function addConnectorFromSelected() {
    if (!selectedCard || !connectorTargetId) {
      return;
    }

    setSession((current) => {
      const from = selectedCard.id;
      const to = connectorTargetId;
      const exists = current.connectors.some(
        (connector) => connector.from === from && connector.to === to && connector.relation === connectorRelation,
      );

      if (exists) {
        return current;
      }

      return {
        ...current,
        connectors: [
          ...current.connectors,
          {
            id: createId("connector"),
            from,
            relation: connectorRelation,
            to,
          },
        ],
      };
    });
  }

  function updateSlice(sliceId: string, changes: Partial<BlueprintSlice>) {
    setSession((current) => ({
      ...current,
      selectedSliceId: sliceId,
      slices: current.slices.map((slice) => (slice.id === sliceId ? { ...slice, ...changes } : slice)),
    }));
  }

  async function copyExportPacket() {
    setCopyStatus("");

    try {
      await navigator.clipboard.writeText(exportPacket);
      setCopyStatus("Copied packet");
    } catch {
      setCopyStatus("Clipboard blocked");
    }
  }

  function downloadExportPacket() {
    const blob = new Blob([exportPacket], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${titleFromSession(session).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "latitude"}-packet.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setCopyStatus("Downloaded packet");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Project Latitude 2.1.0</p>
          <h1>AI Shaping Canvas</h1>
        </div>
        <div className="status-cluster" aria-live="polite">
          <div className="agent-status">
            <Bot size={16} aria-hidden="true" />
            <span>{isShaping ? "Agent shaping..." : providerLabels[session.agent.provider]}</span>
          </div>
          <div className="save-status">
            <Save size={16} aria-hidden="true" />
            <span>{saveStatus}</span>
          </div>
        </div>
      </header>

      <section className="workspace" aria-label="AI shaping workspace">
        <aside className="lane input-lane" aria-label="Input, history, and agent lane">
          <div className="lane-header">
            <span className="lane-kicker">P1.1</span>
            <h2>Input / Agent</h2>
          </div>

          <label className="field">
            <span>Project title</span>
            <input
              value={session.meta.title}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="Untitled shaping session"
            />
          </label>

          <label className="field">
            <span>Target outcome</span>
            <input
              value={session.meta.outcome}
              onChange={(event) => updateOutcome(event.target.value)}
              placeholder="What should the first build slice prove?"
            />
          </label>

          <label className="field grow">
            <span>Working transcript</span>
            <textarea
              value={session.transcript}
              onChange={(event) => updateTranscript(event.target.value)}
              placeholder="Drop the rough product idea, latest voice note, or next shaping turn here."
            />
          </label>

          <button className="primary-button full-width" type="button" onClick={shapeWithAgent} disabled={isShaping}>
            <Sparkles size={17} aria-hidden="true" />
            {isShaping ? "Shaping..." : "Shape with agent"}
          </button>

          {agentError ? (
            <div className="error-banner" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{agentError}</span>
            </div>
          ) : null}

          <div className="agent-panel">
            <div className="panel-heading">
              <span className="snapshot-label">Agent readout</span>
              <strong>{session.agent.lastRunAt ? formatStatusTime(new Date(session.agent.lastRunAt)) : "Idle"}</strong>
            </div>
            <p>{session.agent.summary || "Run a shape turn to let the agent propose canvas operations."}</p>
          </div>

          <div className="stacked-panel">
            <div className="mini-section">
              <h3>Questions</h3>
              {session.agent.questions.length ? (
                <ul>
                  {session.agent.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              ) : (
                <p>No agent questions yet.</p>
              )}
            </div>
            <div className="mini-section">
              <h3>Risks</h3>
              {session.agent.risks.length ? (
                <ul>
                  {session.agent.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              ) : (
                <p>No agent risks yet.</p>
              )}
            </div>
          </div>
        </aside>

        <section className="canvas-lane" aria-label="Canvas board lane">
          <div className="canvas-toolbar">
            <div>
              <span className="lane-kicker">P1.2</span>
              <h2>Canvas Board</h2>
            </div>
            <div className="toolbar-actions">
              <button className="secondary-button" type="button" onClick={() => addCard("question")}>
                <Plus size={16} aria-hidden="true" />
                Question
              </button>
              <button className="primary-button" type="button" onClick={() => addCard()} title="Add manual typed card">
                <Plus size={17} aria-hidden="true" />
                Add card
              </button>
            </div>
          </div>

          <div className="canvas-board" ref={boardRef}>
            <svg className="connector-layer" aria-hidden="true">
              {session.connectors.map((connector) => {
                const from = session.cards.find((card) => card.id === connector.from);
                const to = session.cards.find((card) => card.id === connector.to);
                if (!from || !to) {
                  return null;
                }

                const startX = from.x + CARD_WIDTH / 2;
                const startY = from.y + CARD_HEIGHT / 2;
                const endX = to.x + CARD_WIDTH / 2;
                const endY = to.y + CARD_HEIGHT / 2;
                const controlOffset = Math.max(90, Math.abs(endX - startX) / 2);
                const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${
                  endX - controlOffset
                } ${endY}, ${endX} ${endY}`;

                return (
                  <g key={connector.id}>
                    <path d={path} />
                    <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 8}>
                      {relationLabels[connector.relation]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {session.cards.length === 0 ? (
              <div className="canvas-empty">
                <MousePointer2 size={28} aria-hidden="true" />
                <h3>No blueprint cards yet</h3>
                <p>Add a card or run an agent turn to generate the first typed structure.</p>
              </div>
            ) : null}

            {session.cards.map((card) => (
              <article
                className={`canvas-card type-${card.type} ${
                  card.id === session.selectedCardId ? "is-selected" : ""
                }`}
                key={card.id}
                onClick={() => selectCard(card.id)}
                onPointerDown={(event) => startDragging(event, card)}
                style={{ transform: `translate(${card.x}px, ${card.y}px)` }}
              >
                <div className="card-topline">
                  <span className="type-pill">{typeLabels[card.type]}</span>
                  <span className={`status-dot status-${card.status}`}>{card.status}</span>
                </div>
                <h3>{card.title || "Untitled card"}</h3>
                <p>{card.body || "No details yet."}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="lane inspector-lane" aria-label="Inspector and contract lane">
          <div className="lane-header">
            <span className="lane-kicker">P1.3 / P1.4</span>
            <h2>Inspect / Contract</h2>
          </div>

          {selectedCard ? (
            <div className="inspector-form">
              <div className="selected-summary">
                <Network size={16} aria-hidden="true" />
                <span>{selectedCard.id}</span>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Card type</span>
                  <select
                    value={selectedCard.type}
                    onChange={(event) => editSelectedCard({ type: event.target.value as CardType })}
                  >
                    {cardTypes.map((type) => (
                      <option key={type} value={type}>
                        {typeLabels[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={selectedCard.status}
                    onChange={(event) => editSelectedCard({ status: event.target.value as CardStatus })}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Title</span>
                <input
                  value={selectedCard.title}
                  onChange={(event) => editSelectedCard({ title: event.target.value })}
                />
              </label>

              <label className="field">
                <span>Body</span>
                <textarea
                  value={selectedCard.body}
                  onChange={(event) => editSelectedCard({ body: event.target.value })}
                />
              </label>

              <div className="relationship-editor">
                <div className="panel-heading">
                  <span className="snapshot-label">Relationship</span>
                  <strong>{session.connectors.length}</strong>
                </div>
                <div className="relationship-row">
                  <select
                    value={connectorRelation}
                    onChange={(event) => setConnectorRelation(event.target.value as ConnectorRelation)}
                    aria-label="Connector relation"
                  >
                    {relations.map((relation) => (
                      <option key={relation} value={relation}>
                        {relationLabels[relation]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={connectorTargetId}
                    onChange={(event) => setConnectorTargetId(event.target.value)}
                    aria-label="Connector target card"
                  >
                    {otherCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.title || card.id}
                      </option>
                    ))}
                  </select>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={addConnectorFromSelected}
                    disabled={!connectorTargetId}
                    title="Link selected card"
                  >
                    <Link2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="position-readout">
                <span>x {Math.round(selectedCard.x)}</span>
                <span>y {Math.round(selectedCard.y)}</span>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <h3>Select a card</h3>
              <p>Manual and agent-created cards use the same inspector, so the blueprint stays editable.</p>
            </div>
          )}

          <div className="slice-panel">
            <div className="panel-heading">
              <span className="snapshot-label">Candidate slices</span>
              <strong>{session.slices.length}</strong>
            </div>
            {session.slices.length ? (
              <div className="slice-list">
                {session.slices.map((slice) => (
                  <button
                    className={`slice-row ${slice.id === selectedSlice?.id ? "is-active" : ""}`}
                    key={slice.id}
                    type="button"
                    onClick={() =>
                      setSession((current) => ({
                        ...current,
                        selectedSliceId: slice.id,
                      }))
                    }
                  >
                    <Check size={15} aria-hidden="true" />
                    <span>{slice.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-note">Agent-created slices will appear here.</p>
            )}

            {selectedSlice ? (
              <label className="field">
                <span>Slice status</span>
                <select
                  value={selectedSlice.status}
                  onChange={(event) => updateSlice(selectedSlice.id, { status: event.target.value as SliceStatus })}
                >
                  {sliceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="export-panel">
            <div className="panel-heading">
              <span className="snapshot-label">Build contract</span>
              <strong>{copyStatus || `${exportPacket.length} chars`}</strong>
            </div>
            <textarea className="export-preview" value={exportPacket} readOnly aria-label="Build contract preview" />
            <div className="export-actions">
              <button className="secondary-button" type="button" onClick={copyExportPacket}>
                <ClipboardCopy size={16} aria-hidden="true" />
                Copy
              </button>
              <button className="secondary-button" type="button" onClick={downloadExportPacket}>
                <Download size={16} aria-hidden="true" />
                Download
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
