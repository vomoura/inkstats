"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { confirmResultAction } from "@/server/actions/tournaments";

interface ConfirmationItem {
  id: string;
  playerName: string;
  matchedAlias: string | null;
  standing: number | null;
  wins: number;
  losses: number;
  draws: number;
  event: {
    name: string;
    startDate: Date | null;
  };
}

interface ConfirmationListProps {
  items: ConfirmationItem[];
}

export function ConfirmationList({ items: initialItems }: ConfirmationListProps) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(id: string, confirm: boolean) {
    startTransition(async () => {
      const result = await confirmResultAction(id, confirm);
      if (!result.error) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              &quot;{item.playerName}&quot;
              {item.matchedAlias && (
                <span className="text-muted"> → {item.matchedAlias}</span>
              )}
            </p>
            <p className="text-xs text-muted">
              {item.event.name}
              {item.standing && ` · #${item.standing}`}
              {` · ${item.wins}W-${item.losses}L-${item.draws}D`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleConfirm(item.id, true)}
              disabled={isPending}
              className="p-1.5 rounded-md text-success hover:bg-success/10 transition-colors disabled:opacity-50"
              title="Confirmar — sou eu"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => handleConfirm(item.id, false)}
              disabled={isPending}
              className="p-1.5 rounded-md text-error hover:bg-error/10 transition-colors disabled:opacity-50"
              title="Rejeitar — não sou eu"
            >
              <X size={16} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
