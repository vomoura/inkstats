import Link from "next/link";
import { Trophy, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserTournamentsAction, getPendingConfirmationsAction } from "@/server/actions/tournaments";
import { ConfirmationList } from "@/components/tournaments/confirmation-list";

export default async function TournamentsPage() {
  const [tournamentsResult, pendingResult] = await Promise.all([
    getUserTournamentsAction(),
    getPendingConfirmationsAction(),
  ]);

  const tournaments = tournamentsResult.data ?? [];
  const pending = pendingResult.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus Torneios</h1>

      {/* Pending confirmations */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-warning uppercase tracking-wide">
            Confirmações Pendentes ({pending.length})
          </h2>
          <ConfirmationList items={pending} />
        </div>
      )}

      {/* Tournament list */}
      {tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy size={48} />}
          title="Nenhum torneio confirmado"
          description="Importe eventos do PlayHub e confirme seus resultados para vê-los aqui."
          actionLabel="Importar Eventos"
          actionHref="/import"
        />
      ) : (
        <div className="space-y-2">
          {tournaments.map((result) => (
            <Link key={result.id} href={`/tournaments/${result.eventId}`} className="block group">
              <Card className="transition-colors group-hover:border-accent/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{result.event.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {result.event.startDate && new Date(result.event.startDate).toLocaleDateString("pt-BR")}
                      {result.event.storeName && ` · ${result.event.storeName}`}
                      {result.event.totalPlayers && ` · ${result.event.totalPlayers} jogadores`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">
                      #{result.standing ?? "—"}
                    </p>
                    <p className="text-xs text-muted">
                      {result.wins}W-{result.losses}L-{result.draws}D
                    </p>
                    {result.deckName && (
                      <p className="text-xs text-accent mt-0.5">{result.deckName}</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
