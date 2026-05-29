import { CircleDot, MousePointer2, Plus, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const STORAGE_KEY = "project-latitude:v1:s1-session";
const CARD_WIDTH = 230;
const CARD_HEIGHT = 150;

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

type SessionState = {
  meta: {
    sessionId: string;
    title: string;
  };
  transcript: string;
  cards: BlueprintCard[];
  connectors: Connector[];
  selectedCardId: string | null;
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

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptySession(): SessionState {
  return {
    meta: {
      sessionId: createId("session"),
      title: "",
    },
    transcript: "",
    cards: [],
    connectors: [],
    selectedCardId: null,
  };
}

function isCardType(value: unknown): value is CardType {
  return typeof value === "string" && cardTypes.includes(value as CardType);
}

function isCardStatus(value: unknown): value is CardStatus {
  return typeof value === "string" && statuses.includes(value as CardStatus);
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
              typeof connector.relation === "string" &&
              connector.relation in relationLabels &&
              cardIds.has(connector.from) &&
              cardIds.has(connector.to),
          ),
      )
    : [];

  const selectedCardId =
    typeof saved.selectedCardId === "string" && cardIds.has(saved.selectedCardId)
      ? saved.selectedCardId
      : null;

  return {
    meta: {
      sessionId:
        saved.meta && typeof saved.meta.sessionId === "string"
          ? saved.meta.sessionId
          : createId("session"),
      title: saved.meta && typeof saved.meta.title === "string" ? saved.meta.title : "",
    },
    transcript: typeof saved.transcript === "string" ? saved.transcript : "",
    cards,
    connectors,
    selectedCardId,
  };
}

function loadSession() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeSession(JSON.parse(saved)) : createEmptySession();
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

export default function App() {
  const [session, setSession] = useState<SessionState>(() => loadSession());
  const [saveStatus, setSaveStatus] = useState("Loaded from browser storage");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const selectedCard = useMemo(
    () => session.cards.find((card) => card.id === session.selectedCardId) ?? null,
    [session.cards, session.selectedCardId],
  );

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

  function updateTitle(title: string) {
    setSession((current) => ({
      ...current,
      meta: { ...current.meta, title },
    }));
  }

  function updateTranscript(transcript: string) {
    setSession((current) => ({
      ...current,
      transcript,
    }));
  }

  function addCard() {
    const count = session.cards.length;
    const card: BlueprintCard = {
      id: createId("card"),
      type: "requirement",
      title: "New requirement",
      body: "Describe the shaping artifact.",
      status: "draft",
      x: 72 + (count % 5) * 34,
      y: 72 + (count % 4) * 34,
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Project Latitude V1.0 / S1</p>
          <h1>Manual Blueprint Canvas</h1>
        </div>
        <div className="save-status" aria-live="polite">
          <Save size={16} aria-hidden="true" />
          <span>{saveStatus}</span>
        </div>
      </header>

      <section className="workspace" aria-label="Manual blueprint workspace">
        <aside className="lane input-lane" aria-label="Input and history lane">
          <div className="lane-header">
            <span className="lane-kicker">P1.1</span>
            <h2>Input / History</h2>
          </div>

          <label className="field">
            <span>Project title</span>
            <input
              value={session.meta.title}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="Untitled shaping session"
            />
          </label>

          <label className="field grow">
            <span>Transcript input</span>
            <textarea
              value={session.transcript}
              onChange={(event) => updateTranscript(event.target.value)}
              placeholder="Type the rough product idea here. This stays local in your browser."
            />
          </label>

          <div className="history-snapshot">
            <div>
              <span className="snapshot-label">Local transcript</span>
              <strong>{session.transcript.trim() ? "Captured" : "Empty"}</strong>
            </div>
            <p>{session.transcript.trim() || "Typed turns will remain visible here after refresh."}</p>
          </div>
        </aside>

        <section className="canvas-lane" aria-label="Canvas board lane">
          <div className="canvas-toolbar">
            <div>
              <span className="lane-kicker">P1.2</span>
              <h2>Canvas Board</h2>
            </div>
            <button className="primary-button" type="button" onClick={addCard} title="Add manual typed card">
              <Plus size={17} aria-hidden="true" />
              Add card
            </button>
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
                const controlOffset = Math.max(80, Math.abs(endX - startX) / 2);
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
                <p>Add a typed card, then edit it in the inspector and drag it around the board.</p>
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

        <aside className="lane inspector-lane" aria-label="Inspector lane">
          <div className="lane-header">
            <span className="lane-kicker">P1.3</span>
            <h2>Inspector</h2>
          </div>

          {selectedCard ? (
            <div className="inspector-form">
              <div className="selected-summary">
                <CircleDot size={16} aria-hidden="true" />
                <span>{selectedCard.id}</span>
              </div>

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

              <label className="field">
                <span>Title</span>
                <input
                  value={selectedCard.title}
                  onChange={(event) => editSelectedCard({ title: event.target.value })}
                />
              </label>

              <label className="field grow">
                <span>Body</span>
                <textarea
                  value={selectedCard.body}
                  onChange={(event) => editSelectedCard({ body: event.target.value })}
                />
              </label>

              <div className="position-readout">
                <span>x {Math.round(selectedCard.x)}</span>
                <span>y {Math.round(selectedCard.y)}</span>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <h3>Select a card</h3>
              <p>Manual cards can be typed, edited, and moved without touching implementation code.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
