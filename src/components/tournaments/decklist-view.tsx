"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { InkIcon, CostIcon } from "@/components/ui/ink-icon";
import { Download, BookOpen, X, Grid2X2, List, Layers, ClipboardPaste, Save } from "lucide-react";
import { importDecklistAction, getDecklistAction, importManualDecklistAction } from "@/server/actions/decklist";
import { updateDeckMetadataAction } from "@/server/actions/tournaments";

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
  inkColors: string;
  notes: string;
  hasToken: boolean;
  initialCards: DeckCard[];
}

type ViewMode = "grid" | "list" | "stack";

export function DecklistView({ eventId, resultId, deckName: initialDeckName, deckId, inkColors: initialInkColors, notes: initialNotes, hasToken, initialCards }: DecklistViewProps) {
  const [cards, setCards] = useState<DeckCard[]>(initialCards);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(initialCards.length > 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual deck form state
  const [deckName, setDeckName] = useState(initialDeckName ?? "");
  const [selectedColors, setSelectedColors] = useState<string[]>(
    initialInkColors ? initialInkColors.split(",").map((c) => c.trim()).filter(Boolean) : []
  );
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);

  // Paste modal state
  const [pasteDeckName, setPasteDeckName] = useState("");
  const [pasteText, setPasteText] = useState("");

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (modalOpen || pasteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen, pasteModalOpen]);

  function handleImportDecklist() {
    setError(null);
    startTransition(async () => {
      const result = await importDecklistAction(eventId, resultId);
      if (result.error) {
        if (result.error.includes("Nenhuma decklist")) {
          // No decklist on PlayHub — show manual form
          setShowManualForm(true);
        } else {
          setError(result.error);
        }
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

  function handleSaveDeckMetadata() {
    setSaved(false);
    startTransition(async () => {
      const result = await updateDeckMetadataAction(resultId, {
        deckName,
        inkColors: selectedColors.join(","),
        notes,
      });
      if (!result.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await importManualDecklistAction(resultId, pasteDeckName, pasteText);
      if (result.error) {
        setError(result.error);
      } else {
        setImported(true);
        setPasteModalOpen(false);
        const cardsResult = await getDecklistAction(resultId);
        if (cardsResult.data) {
          setCards(cardsResult.data);
        }
        if (pasteDeckName) setDeckName(pasteDeckName);
      }
    });
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) => {
      if (prev.includes(color)) return prev.filter((c) => c !== color);
      if (prev.length >= 2) return [prev[1], color];
      return [...prev, color];
    });
  }

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const INK_COLORS_LIST = ["Amber", "Amethyst", "Emerald", "Ruby", "Sapphire", "Steel"];

  // Group cards by type
  const grouped = cards.reduce<Record<string, DeckCard[]>>((acc, card) => {
    let type = card.type ?? "Other";
    if (type === "Action" && card.subtype?.includes("Song")) type = "Song";
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
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="mb-0">Deck</CardTitle>
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
            {!imported && hasToken && !showManualForm && (
              <button
                onClick={handleImportDecklist}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                <Download size={12} />
                {isPending ? "Importando..." : "Importar do PlayHub"}
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-error mb-3">{error}</p>}

        {/* Deck info display */}
        <div className="space-y-3">
          {/* Deck name + ink icons */}
          <div className="flex items-center gap-3">
            {deckName && <span className="font-medium text-sm">{deckName}</span>}
            {selectedColors.length > 0 && (
              <div className="flex items-center gap-1">
                {selectedColors.length === 2 ? (
                  <InkIcon ink={selectedColors.join(",")} size={24} />
                ) : (
                  selectedColors.map((c) => <InkIcon key={c} ink={c} size={24} />)
                )}
              </div>
            )}
            {!deckName && !showManualForm && !imported && (
              <span className="text-sm text-muted">Nenhum deck definido</span>
            )}
          </div>

          {/* Manual form (shown when no PlayHub deck or always for editing) */}
          {(showManualForm || imported || deckName) && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-muted mb-1">Nome do deck</label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Ex: Super Detectives"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Cores</label>
                  <div className="flex items-center gap-1">
                    {INK_COLORS_LIST.map((color) => (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`p-0.5 rounded-md transition-all ${
                          selectedColors.includes(color) ? "ring-2 ring-accent scale-110" : "opacity-50 hover:opacity-100"
                        }`}
                      >
                        <InkIcon ink={color} size={24} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações..."
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveDeckMetadata}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  <Save size={12} />
                  Salvar
                </button>
                {!imported && (
                  <button
                    onClick={() => setPasteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent-light hover:text-accent transition-colors"
                  >
                    <ClipboardPaste size={12} />
                    Importar Deck
                  </button>
                )}
                {saved && <span className="text-xs text-success">Salvo!</span>}
              </div>
            </div>
          )}

          {/* Show manual form toggle when no deck and no token */}
          {!imported && !showManualForm && !hasToken && !deckName && (
            <button
              onClick={() => setShowManualForm(true)}
              className="text-xs text-accent hover:underline"
            >
              Definir deck manualmente
            </button>
          )}
        </div>
      </Card>

      {/* Paste Deck Modal */}
      {pasteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setPasteModalOpen(false)}
        >
          <div className="bg-card border border-border rounded-xl w-full max-w-lg flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold text-lg">Importar Deck</h2>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="p-2 rounded-md text-muted hover:text-foreground hover:bg-border/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Nome do Deck (opcional)</label>
                <input
                  type="text"
                  value={pasteDeckName}
                  onChange={(e) => setPasteDeckName(e.target.value)}
                  placeholder="Ex: Ruby/Steel Aggro"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Cole sua decklist</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"4 Maximus - Team Champion\n4 Mushu - Majestic Dragon\n3 Strength of a Raging Fire\n..."}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  rows={12}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePasteSubmit}
                  disabled={isPending || !pasteText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  <Download size={14} />
                  {isPending ? "Importando..." : "Importar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Decklist Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-bold text-lg">{deckName || initialDeckName || "Decklist"}</h2>
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

// --- Grid View ---
function GridView({ cards }: { cards: DeckCard[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {cards.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((card) => (
        <div key={card.id} className="relative group">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.displayName} className="w-full rounded-lg border border-border shadow-sm" loading="lazy" />
          ) : (
            <div className="w-full aspect-[2.5/3.5] rounded-lg border border-border bg-border/30 flex items-center justify-center p-2">
              <span className="text-[10px] text-center text-muted leading-tight">{card.displayName}</span>
            </div>
          )}
          <span className="absolute top-1.5 right-1.5 text-[11px] font-bold bg-accent text-white min-w-[24px] text-center px-1.5 py-0.5 rounded-full shadow">
            {card.quantity}×
          </span>
        </div>
      ))}
    </div>
  );
}

// --- List View ---
function ListView({ cards }: { cards: DeckCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
      {cards.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((card) => {
        const bgColor = getInkBgColor(card.inkColor);
        return (
          <div key={card.id} className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-md" style={{ backgroundColor: bgColor }}>
            <span className="text-xs font-bold text-white/80 w-6 text-right shrink-0">{card.quantity}×</span>
            {card.inkColor && <InkIcon ink={card.inkColor} size={20} className="shrink-0" />}
            {card.cost !== null && <CostIcon cost={card.cost} inkable={card.inkable} size={20} className="shrink-0" />}
            <span className="text-sm text-white truncate flex-1">{card.displayName}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Stack View ---
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
  const qty = Math.min(card.quantity, 4);
  const stackHeight = (qty - 1) * 24;

  return (
    <div className="relative" style={{ marginBottom: `${stackHeight}px` }}>
      {Array.from({ length: qty }).map((_, i) => (
        <div key={i} className={`${i === 0 ? "relative" : "absolute left-0 right-0"}`} style={{ top: i === 0 ? undefined : `${i * 24}px`, zIndex: i + 1 }}>
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.displayName} className={`w-full rounded-lg border border-border shadow-sm ${i < qty - 1 ? "brightness-[0.6]" : ""}`} loading="lazy" />
          ) : (
            <div className={`w-full aspect-[2.5/3.5] rounded-lg border border-border bg-border/30 flex items-center justify-center p-2 ${i < qty - 1 ? "brightness-[0.6]" : ""}`}>
              {i === qty - 1 && <span className="text-[10px] text-center text-muted leading-tight">{card.displayName}</span>}
            </div>
          )}
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

function getInkBgColor(inkColor: string | null): string {
  if (!inkColor) return "#4A5568";
  const colors: Record<string, string> = {
    sapphire: "#1B4F72",
    steel: "#4A5568",
    amber: "#935116",
    emerald: "#145A32",
    ruby: "#7B241C",
    amethyst: "#512E5F",
  };
  return colors[inkColor.toLowerCase().trim()] ?? "#4A5568";
}
