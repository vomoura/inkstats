"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateDeckMetadataAction } from "@/server/actions/tournaments";

const INK_COLORS = ["Amber", "Amethyst", "Emerald", "Ruby", "Sapphire", "Steel"];

interface DeckEditorProps {
  resultId: string;
  initialDeckName: string;
  initialInkColors: string;
  initialNotes: string;
}

export function DeckEditor({ resultId, initialDeckName, initialInkColors, initialNotes }: DeckEditorProps) {
  const [deckName, setDeckName] = useState(initialDeckName);
  const [selectedColors, setSelectedColors] = useState<string[]>(
    initialInkColors ? initialInkColors.split(",").map((c) => c.trim()) : []
  );
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleColor(color: string) {
    setSelectedColors((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      }
      if (prev.length >= 2) {
        return [prev[1], color];
      }
      return [...prev, color];
    });
  }

  function handleSave() {
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

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">Deck</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Nome do deck</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Ex: Amethyst/Steel Control"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Cores de tinta (2)</label>
          <div className="flex flex-wrap gap-1">
            {INK_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedColors.includes(color)
                    ? "bg-accent text-white"
                    : "bg-border/50 text-muted hover:bg-border"
                }`}
              >
                {color}
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
          placeholder="Observações sobre o torneio, meta, sideboard..."
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <Save size={12} />
          Salvar Deck
        </button>
        {saved && <span className="text-xs text-success">Salvo!</span>}
      </div>
    </div>
  );
}
