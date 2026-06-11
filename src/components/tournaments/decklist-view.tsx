"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { InkIcon, CostIcon } from "@/components/ui/ink-icon";
import { Download, BookOpen, X, Grid2X2, List, Layers } from "lucide-react";
import { importDecklistAction, getDecklistAction } from "@/server/actions/decklist";

interface DeckCard {
  id: string;
  cardName: string;
  displayName: string;
  quantity: number;
  cost: number | null;
  inkable: boolean | null;
  type: string | null;
  subtype: string | null;
  inkColor: string | null;
  rarity: string | null;
  setName: string | null;
  imageUrl: string | null;
}

interface DecklistViewProps {
  eventId: string;
  resultId: string;
  deckName: string | null;
  deckId: string | null;
  hasToken: boolean;
  initialCards: DeckCard[];
}

type ViewMode = "grid" | "list" | "stack";

export function DecklistView({ eventId, resultId, deckName, deckId, hasToken, initialCards }: DecklistViewProps) {
  const [cards, setCards] = useState<DeckCard[]>(initialCards);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(initialCards.length > 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  function handleImportDecklist() {
    setError(null);
    startTransition(async () => {
      const result = await importDecklistAction(eventId, resultId);
      if (result.error) {
        setError(result.error);
      } else {
        setImported(true);
        const cardsResult = await getDecklistAction(resultId);
        if (cardsResult.data) {
          setCards(cardsResult.data);
        }
        setModalOpen(true);
      }
    });
  }

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);

  // Group cards by type, separating Songs from Actions
  const grouped = cards.reduce<Record<string, DeckCard[]>>((acc, card) => {
    let type = card.type ?? "Other";
    if (type === "Action" && card.subtype?.includes("Song")) {
      type = "Song";
    }
    if (!acc[type]) acc[type] = [];
    acc[type].push(card);
    return acc;
  }, {});

  const typeOrder = ["Character", "Action", "Song", "Item", "Location", "Other"];
  const sortedGroups = typeOrder
    .filter((t) => grouped[t] && grouped[t].length > 0)
    .map((t) => [t, grouped[t]] as [string, DeckCard[]]);

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-accent" />
            <CardTitle className="mb-0">Decklist</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {imported && cards.length > 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent-light hover:text-accent transition-colors"
              >
                <BookOpen size={12} />
                Ver Decklist ({totalCards})
              </button>
            )}
            {!imported && hasToken && (
              <button
                onClick={handleImportDecklist}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                <Download size={12} />
                {isPending ? "Importando..." : "Importar Decklist"}
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-error mt-2">{error}</p>}
        {!imported && !hasToken && (
          <p className="text-sm text-muted mt-3">
            Configure seu token PlayHub nas configurações para importar decklists.
          </p>
        )}
        {imported && cards.length > 0 && !modalOpen && (
          <p className="text-sm text-muted mt-2">
            {deckName ?? "Deck"} · {totalCards} cartas
          </p>
        )}
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-bold text-lg">{deckName ?? "Decklist"}</h2>
                <p className="text-xs text-muted">{totalCards} cartas</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${viewMode === "grid" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-border/50"}`}
                    title="Lado a lado"
                  >
                    <Grid2X2 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-border/50"}`}
                    title="Lista"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("stack")}
                    className={`p-2 transition-colors ${viewMode === "stack" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-border/50"}`}
                    title="Pilha"
                  >
                    <Layers size={16} />
                  </button>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-md text-muted hover:text-foreground hover:bg-border/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">
              {sortedGroups.map(([type, typeCards]) => (
                <div key={type} className="mb-6 last:mb-0">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
                    {type} ({typeCards.reduce((s, c) => s + c.quantity, 0)})
                  </p>

                  {viewMode === "grid" && <GridView cards={typeCards} />}
                  {viewMode === "list" && <ListView cards={typeCards} />}
                  {viewMode === "stack" && <StackView cards={typeCards} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Grid View: card images with quantity badge, no ink icons ---
function GridView({ cards }: { cards: DeckCard[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {cards.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((card) => (
        <div key={card.id} className="relative group">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.displayName}
              className="w-full rounded-lg border border-border shadow-sm"
              loading="lazy"
            />
          ) : (
            <div className="w-full aspect-[2.5/3.5] rounded-lg border border-border bg-border/30 flex items-center justify-center p-2">
              <span className="text-[10px] text-center text-muted leading-tight">{card.displayName}</span>
            </div>
          )}
          {/* Quantity badge */}
          <span className="absolute top-1.5 right-1.5 text-[11px] font-bold bg-accent text-white min-w-[24px] text-center px-1.5 py-0.5 rounded-full shadow">
            {card.quantity}×
          </span>
        </div>
      ))}
    </div>
  );
}

// --- List View: quantity, ink icon, cost, name ---
function ListView({ cards }: { cards: DeckCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5">
      {cards.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((card) => (
        <div key={card.id} className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-accent-light/30 transition-colors">
          <span className="text-xs font-bold text-muted w-6 text-right shrink-0">{card.quantity}×</span>
          {card.inkColor && <InkIcon ink={card.inkColor} size={14} className="shrink-0" />}
          {card.cost !== null && (
            <CostIcon cost={card.cost} inkable={card.inkable} size={18} className="shrink-0" />
          )}
          <span className="text-sm truncate flex-1">{card.displayName}</span>
        </div>
      ))}
    </div>
  );
}

// --- Stack View: overlapping card images like a pile, with quantity ---
function StackView({ cards }: { cards: DeckCard[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {cards.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((card) => (
        <StackCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function StackCard({ card }: { card: DeckCard }) {
  // Create a stack of overlapping cards based on quantity (max 4)
  // Spacing: 0, 1.5rem, 3rem, 4.5rem (24px apart)
  const qty = Math.min(card.quantity, 4);
  const stackHeight = (qty - 1) * 24; // extra height needed for stacking

  return (
    <div className="relative" style={{ marginBottom: `${stackHeight}px` }}>
      {Array.from({ length: qty }).map((_, i) => (
        <div
          key={i}
          className={`${i === 0 ? "relative" : "absolute left-0 right-0"}`}
          style={{
            top: i === 0 ? undefined : `${i * 24}px`,
            zIndex: i + 1,
          }}
        >
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.displayName}
              className={`w-full rounded-lg border border-border shadow-sm ${i < qty - 1 ? "brightness-[0.6]" : ""}`}
              loading="lazy"
            />
          ) : (
            <div className={`w-full aspect-[2.5/3.5] rounded-lg border border-border bg-border/30 flex items-center justify-center p-2 ${i < qty - 1 ? "brightness-[0.6]" : ""}`}>
              {i === qty - 1 && <span className="text-[10px] text-center text-muted leading-tight">{card.displayName}</span>}
            </div>
          )}
          {/* Only show quantity badge on the topmost card */}
          {i === qty - 1 && (
            <span className="absolute top-1.5 right-1.5 text-[11px] font-bold bg-accent text-white min-w-[24px] text-center px-1.5 py-0.5 rounded-full shadow">
              {card.quantity}×
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
