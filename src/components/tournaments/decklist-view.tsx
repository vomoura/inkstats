"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { InkIcon, CostIcon } from "@/components/ui/ink-icon";
import { Download, BookOpen, X, Grid2X2, List, Layers, ClipboardPaste, Save, Share2, Trash2, Copy, Image as ImageIcon, Minus, Plus } from "lucide-react";
import { importDecklistAction, getDecklistAction, importManualDecklistAction, deleteDecklistAction } from "@/server/actions/decklist";
import { updateDeckMetadataAction } from "@/server/actions/tournaments";
import { Toast } from "@/components/ui/toast";

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
  playerName?: string;
}

type ViewMode = "grid" | "list" | "stack";

export function DecklistView({ eventId, resultId, deckName: initialDeckName, deckId, inkColors: initialInkColors, notes: initialNotes, hasToken, initialCards, playerName }: DecklistViewProps) {
  const [cards, setCards] = useState<DeckCard[]>(initialCards);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(initialCards.length > 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDropdown, setExportDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [noPlayHubDeck, setNoPlayHubDeck] = useState(false);
  const [columns, setColumns] = useState(8);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual form state
  const [deckName, setDeckName] = useState(initialDeckName ?? "");
  const [selectedColors, setSelectedColors] = useState<string[]>(
    initialInkColors ? initialInkColors.split(",").map((c) => c.trim()).filter(Boolean) : []
  );
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);

  // Paste modal state
  const [pasteDeckName, setPasteDeckName] = useState("");
  const [pasteText, setPasteText] = useState("");

  const detectedColors = [...new Set(cards.map((c) => c.inkColor).filter(Boolean))] as string[];
  const displayColors = imported && detectedColors.length > 0 ? detectedColors : selectedColors;

  useEffect(() => {
    if (modalOpen || pasteModalOpen || exportModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen, pasteModalOpen, exportModalOpen]);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportDropdown) return;
    const handler = () => setExportDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [exportDropdown]);

  function handleImportDecklist() {
    setError(null);
    startTransition(async () => {
      const result = await importDecklistAction(eventId, resultId);
      if (result.error) {
        if (result.error.includes("Nenhuma decklist")) setNoPlayHubDeck(true);
        else setError(result.error);
      } else {
        setImported(true);
        setNoPlayHubDeck(false);
        const cardsResult = await getDecklistAction(resultId);
        if (cardsResult.data) setCards(cardsResult.data);
        setModalOpen(true);
      }
    });
  }

  function handleDeleteDeck() {
    startTransition(async () => {
      const result = await deleteDecklistAction(resultId);
      if (!result.error) {
        setImported(false);
        setCards([]);
        setDeckName("");
        setSelectedColors([]);
      }
    });
  }

  function handleSaveDeckMetadata() {
    setSaved(false);
    startTransition(async () => {
      const result = await updateDeckMetadataAction(resultId, { deckName, inkColors: selectedColors.join(","), notes });
      if (!result.error) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    });
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await importManualDecklistAction(resultId, pasteDeckName, pasteText);
      if (result.error) setError(result.error);
      else {
        setImported(true);
        setNoPlayHubDeck(false);
        setPasteModalOpen(false);
        const cardsResult = await getDecklistAction(resultId);
        if (cardsResult.data) setCards(cardsResult.data);
        if (pasteDeckName) setDeckName(pasteDeckName);
      }
    });
  }

  function handleCopyList() {
    const text = cards
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((c) => `${c.quantity} ${c.displayName}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setExportDropdown(false);
    setToastMessage("Lista copiada");
  }

  function handleExportImage() {
    setExportDropdown(false);
    setExportModalOpen(true);
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
  const currentDeckName = deckName || initialDeckName || "Deck";

  // Group cards
  const grouped = cards.reduce<Record<string, DeckCard[]>>((acc, card) => {
    let type = card.type ?? "Other";
    if (type === "Action" && card.subtype?.includes("Song")) type = "Song";
    if (!acc[type]) acc[type] = [];
    acc[type].push(card);
    return acc;
  }, {});
  const typeOrder = ["Character", "Action", "Song", "Item", "Location", "Other"];
  const sortedGroups = typeOrder.filter((t) => grouped[t]?.length).map((t) => [t, grouped[t]] as [string, DeckCard[]]);

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle className="mb-0">Deck</CardTitle>
          {!imported && hasToken && !noPlayHubDeck && (
            <button onClick={handleImportDecklist} disabled={isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors">
              <Download size={12} /> {isPending ? "Importando..." : "Importar do PlayHub"}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-error mt-2">{error}</p>}

        {/* Imported deck: name + colors + buttons in one line */}
        {imported && cards.length > 0 && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="font-medium text-sm">{currentDeckName}</span>
            {displayColors.length > 0 && (
              displayColors.length === 2
                ? <InkIcon ink={displayColors.join(",")} size={24} />
                : displayColors.map((c) => <InkIcon key={c} ink={c} size={24} />)
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              {!deckId && (
                <button onClick={handleDeleteDeck} disabled={isPending} className="p-1.5 rounded-md text-muted hover:text-error hover:bg-error/10 transition-colors" title="Excluir deck">
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-xs font-medium hover:bg-accent-light hover:text-accent transition-colors">
                <BookOpen size={12} /> Ver ({totalCards})
              </button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setExportDropdown(!exportDropdown); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-xs font-medium hover:bg-accent-light hover:text-accent transition-colors">
                  <Share2 size={12} /> Exportar
                </button>
                {exportDropdown && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-md shadow-lg py-1 min-w-[140px]">
                    <button onClick={handleCopyList} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent-light transition-colors text-left">
                      <Copy size={12} /> Copiar lista
                    </button>
                    <button onClick={handleExportImage} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent-light transition-colors text-left">
                      <ImageIcon size={12} /> Exportar imagem
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No deck: show only import button initially, manual form only after PlayHub fails */}
        {!imported && (
          <div className="space-y-4 mt-3">
            {noPlayHubDeck && (
              <>
                <p className="text-sm text-muted">Nenhuma decklist encontrada para este evento.</p>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Incluir deck manualmente</p>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-muted mb-1">Nome do deck</label>
                      <input type="text" value={deckName} onChange={(e) => setDeckName(e.target.value)} placeholder="Ex: Super Detectives" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" maxLength={100} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Cores</label>
                      <div className="flex items-center gap-1">
                        {INK_COLORS_LIST.map((color) => (
                          <button key={color} onClick={() => toggleColor(color)} className={`p-0.5 rounded-md transition-all ${selectedColors.includes(color) ? "ring-2 ring-accent scale-110" : "opacity-50 hover:opacity-100"}`}>
                            <InkIcon ink={color} size={24} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Notas</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none" rows={2} maxLength={500} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleSaveDeckMetadata} disabled={isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors">
                      <Save size={12} /> Salvar
                    </button>
                    <button onClick={() => setPasteModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent-light hover:text-accent transition-colors">
                      <ClipboardPaste size={12} /> Incluir Deck
                    </button>
                    {saved && <span className="text-xs text-success">Salvo!</span>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Paste Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setPasteModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold text-lg">Incluir Deck</h2>
              <button onClick={() => setPasteModalOpen(false)} className="p-2 rounded-md text-muted hover:text-foreground hover:bg-border/50 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Nome do Deck (opcional)</label>
                <input type="text" value={pasteDeckName} onChange={(e) => setPasteDeckName(e.target.value)} placeholder="Ex: Ruby/Steel Aggro" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Cole sua decklist</label>
                <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"4 Maximus - Team Champion\n4 Mushu - Majestic Dragon\n..."} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none" rows={12} />
              </div>
              <div className="flex justify-end">
                <button onClick={handlePasteSubmit} disabled={isPending || !pasteText.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors">
                  <Download size={14} /> {isPending ? "Importando..." : "Incluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Image Modal */}
      {exportModalOpen && (
        <ExportImageModal
          cards={cards}
          deckName={currentDeckName}
          playerName={playerName ?? "Player"}
          inkColors={displayColors}
          columns={columns}
          setColumns={setColumns}
          onClose={() => setExportModalOpen(false)}
        />
      )}

      {/* View Decklist Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-bold text-lg">{currentDeckName}</h2>
                  <p className="text-xs text-muted">{totalCards} cartas</p>
                </div>
                {displayColors.length > 0 && (displayColors.length === 2 ? <InkIcon ink={displayColors.join(",")} size={28} /> : displayColors.map((c) => <InkIcon key={c} ink={c} size={28} />))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-md overflow-hidden">
                  <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-border/50"}`}><Grid2X2 size={16} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-border/50"}`}><List size={16} /></button>
                  <button onClick={() => setViewMode("stack")} className={`p-2 transition-colors ${viewMode === "stack" ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-border/50"}`}><Layers size={16} /></button>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-md text-muted hover:text-foreground hover:bg-border/50 transition-colors"><X size={18} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {sortedGroups.map(([type, typeCards]) => (
                <div key={type} className="mb-6 last:mb-0">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">{type} ({typeCards.reduce((s, c) => s + c.quantity, 0)})</p>
                  {viewMode === "grid" && <GridView cards={typeCards} />}
                  {viewMode === "list" && <ListView cards={typeCards} />}
                  {viewMode === "stack" && <StackView cards={typeCards} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </>
  );
}

// --- Export Image Modal ---
function ExportImageModal({ cards, deckName, playerName, inkColors, columns, setColumns, onClose }: {
  cards: DeckCard[];
  deckName: string;
  playerName: string;
  inkColors: string[];
  columns: number;
  setColumns: (n: number) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const gradientColors = inkColors.map((c) => getInkGradientColor(c));
  const gradient = gradientColors.length >= 2
    ? `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
    : gradientColors.length === 1
    ? `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[0]}80 100%)`
    : "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)";

  const sortedCards = [...cards].sort((a, b) => (b.quantity - a.quantity) || a.displayName.localeCompare(b.displayName));

  async function handleDownload() {
    if (!canvasRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(canvasRef.current, { useCORS: true, allowTaint: true, scale: 2 });
      const link = document.createElement("a");
      link.download = `${deckName.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setDownloading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-lg">Exportar Imagem</h2>
          <button onClick={onClose} className="p-2 rounded-md text-muted hover:text-foreground hover:bg-border/50 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Column selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Colunas:</span>
            <button onClick={() => setColumns(Math.max(6, columns - 1))} className="p-1 rounded border border-border hover:bg-border/50"><Minus size={14} /></button>
            <span className="font-bold text-sm w-4 text-center">{columns}</span>
            <button onClick={() => setColumns(Math.min(10, columns + 1))} className="p-1 rounded border border-border hover:bg-border/50"><Plus size={14} /></button>
          </div>

          {/* Preview */}
          <div ref={canvasRef} className="rounded-lg overflow-hidden" style={{ background: gradient }}>
            <div className="px-4 py-3 text-center">
              <p className="text-white font-bold text-lg">{playerName} — {deckName}</p>
            </div>
            <div className="px-3 pb-3" style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "4px" }}>
              {sortedCards.map((card) => (
                <div key={card.id} className="relative">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.displayName} className="w-full rounded-sm" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] rounded-sm bg-black/30 flex items-center justify-center">
                      <span className="text-[8px] text-white/70 text-center px-1">{card.displayName}</span>
                    </div>
                  )}
                  <span className="absolute top-0.5 right-0.5 text-[10px] font-bold bg-black/70 text-white px-1 rounded">
                    {card.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Download button */}
          <div className="flex justify-end">
            <button onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors">
              <Download size={14} /> {downloading ? "Gerando..." : "Download"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Grid View ---
function GridView({ cards }: { cards: DeckCard[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {cards.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((card) => (
        <div key={card.id} className="relative">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.displayName} className="w-full rounded-lg border border-border shadow-sm" loading="lazy" />
          ) : (
            <div className="w-full aspect-[2.5/3.5] rounded-lg border border-border bg-border/30 flex items-center justify-center p-2">
              <span className="text-[10px] text-center text-muted leading-tight">{card.displayName}</span>
            </div>
          )}
          <span className="absolute top-1.5 right-1.5 text-[11px] font-bold bg-accent text-white min-w-[24px] text-center px-1.5 py-0.5 rounded-full shadow">{card.quantity}×</span>
        </div>
      ))}
    </div>
  );
}

// --- List View ---
function ListView({ cards }: { cards: DeckCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
      {cards.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((card) => (
        <div key={card.id} className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-md" style={{ backgroundColor: getInkBgColor(card.inkColor) }}>
          <span className="text-xs font-bold text-white/80 w-6 text-right shrink-0">{card.quantity}×</span>
          {card.inkColor && <InkIcon ink={card.inkColor} size={20} className="shrink-0" />}
          {card.cost !== null && <CostIcon cost={card.cost} inkable={card.inkable} size={20} className="shrink-0" />}
          <span className="text-sm text-white truncate flex-1">{card.displayName}</span>
        </div>
      ))}
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
          {i === qty - 1 && <span className="absolute top-1.5 right-1.5 text-[11px] font-bold bg-accent text-white min-w-[24px] text-center px-1.5 py-0.5 rounded-full shadow">{card.quantity}×</span>}
        </div>
      ))}
    </div>
  );
}

function getInkBgColor(inkColor: string | null): string {
  if (!inkColor) return "#4A5568";
  const colors: Record<string, string> = { sapphire: "#1B4F72", steel: "#4A5568", amber: "#935116", emerald: "#145A32", ruby: "#7B241C", amethyst: "#512E5F" };
  return colors[inkColor.toLowerCase().trim()] ?? "#4A5568";
}

function getInkGradientColor(ink: string): string {
  const colors: Record<string, string> = { sapphire: "#2980B9", steel: "#7F8C8D", amber: "#E67E22", emerald: "#27AE60", ruby: "#C0392B", amethyst: "#8E44AD" };
  return colors[ink.toLowerCase().trim()] ?? "#7F8C8D";
}
