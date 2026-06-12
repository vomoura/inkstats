import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { getEventDetailAction } from "@/server/actions/tournaments";
import { getProfileAction } from "@/server/actions/profile";
import { getDecklistAction } from "@/server/actions/decklist";
import { DecklistView } from "@/components/tournaments/decklist-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TournamentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { id } = await params;
  const [{ data: event, error }, { data: profile }] = await Promise.all([
    getEventDetailAction(id),
    getProfileAction(),
  ]);

  if (error || !event) {
    notFound();
  }

  const userResults = event.results.filter((r) => r.isUserResult && !r.needsConfirmation);
  const userResult = userResults[0] ?? null;

  // Load decklist cards if available
  let deckCards: Awaited<ReturnType<typeof getDecklistAction>>["data"] = [];
  if (userResult) {
    const deckResult = await getDecklistAction(userResult.id);
    deckCards = deckResult.data ?? [];
  }

  return (
    <div className="space-y-6">
      <Link href="/tournaments" className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <p className="text-sm text-muted mt-1">
          {event.startDate && new Date(event.startDate).toLocaleDateString("pt-BR")}
          {event.storeName && ` · ${event.storeName}`}
          {event.city && ` · ${event.city}`}
          {event.totalPlayers && ` · ${event.totalPlayers} jogadores`}
        </p>
        {event.format && <p className="text-xs text-muted mt-0.5">Formato: {event.format}</p>}
      </div>

      {/* User result summary */}
      {userResult && (
        <Card>
          <CardTitle>Seu Resultado</CardTitle>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted">Posição</p>
              <p className="text-xl font-bold">#{userResult.standing ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Record</p>
              <p className="text-xl font-bold">{userResult.wins}-{userResult.losses}-{userResult.draws}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Pontos</p>
              <p className="text-xl font-bold">{userResult.points ?? "—"}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Decklist section */}
      {userResult && (
        <DecklistView
          eventId={id}
          resultId={userResult.id}
          deckName={userResult.deckName}
          deckId={userResult.deckId ?? null}
          inkColors={userResult.inkColors ?? ""}
          notes={userResult.notes ?? ""}
          hasToken={!!profile?.playHubToken}
          initialCards={deckCards ?? []}
          playerName={profile?.displayName ?? "Player"}
        />
      )}

      {/* Matches */}
      {event.matches.length > 0 && (
        <Card>
          <CardTitle>Partidas ({event.matches.filter((m) => m.isUserMatch).length} suas)</CardTitle>
          <div className="mt-3 space-y-1">
            {event.matches
              .filter((m) => m.isUserMatch)
              .sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0))
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-6">R{m.roundNumber}</span>
                    <span className="text-sm">vs {m.opponentName ?? "BYE"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.score && <span className="text-xs text-muted">{m.score}</span>}
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        m.result === "WIN"
                          ? "bg-success/10 text-success"
                          : m.result === "LOSS"
                          ? "bg-error/10 text-error"
                          : m.result === "DRAW"
                          ? "bg-warning/10 text-warning"
                          : "bg-border text-muted"
                      }`}
                    >
                      {m.result === "WIN" ? "V" : m.result === "LOSS" ? "D" : m.result === "DRAW" ? "E" : "?"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Full standings */}
      {event.results.length > 0 && (
        <Card>
          <CardTitle>Standings ({event.results.length})</CardTitle>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <th className="pb-2 pr-3">#</th>
                  <th className="pb-2 pr-3">Jogador</th>
                  <th className="pb-2 pr-3">Record</th>
                  <th className="pb-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {event.results.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border/50 ${
                      r.isUserResult ? "bg-accent-light/50 font-medium" : ""
                    }`}
                  >
                    <td className="py-1.5 pr-3 text-muted">{r.standing ?? "—"}</td>
                    <td className="py-1.5 pr-3">{r.playerName}</td>
                    <td className="py-1.5 pr-3">{r.wins}-{r.losses}-{r.draws}</td>
                    <td className="py-1.5">{r.points ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
