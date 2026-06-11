import { BarChart3 } from "lucide-react";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { getStatsAction } from "@/server/actions/stats";
import { WinRateChart } from "@/components/stats/win-rate-chart";
import { GroupedTable } from "@/components/stats/grouped-table";

export default async function StatsPage() {
  const { data: stats, error } = await getStatsAction();

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!stats || stats.overall.totalTournaments === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <EmptyState
          icon={<BarChart3 size={48} />}
          title="Sem dados suficientes"
          description="Importe e confirme seus resultados de torneios para ver suas estatísticas aqui."
          actionLabel="Importar Eventos"
          actionHref="/import"
        />
      </div>
    );
  }

  const { overall, breakdown, recentForm5, recentForm10 } = stats;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estatísticas</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardTitle>Win Rate</CardTitle>
          <CardValue className="text-accent">{overall.winRate}%</CardValue>
          <p className="text-xs text-muted mt-1">sem draws: {overall.winRateNoDraws}%</p>
        </Card>
        <Card>
          <CardTitle>Torneios</CardTitle>
          <CardValue>{overall.totalTournaments}</CardValue>
        </Card>
        <Card>
          <CardTitle>Partidas</CardTitle>
          <CardValue>{overall.totalMatches}</CardValue>
          <p className="text-xs text-muted mt-1">
            {overall.wins}W {overall.losses}L {overall.draws}D
          </p>
        </Card>
        <Card>
          <CardTitle>Melhor Posição</CardTitle>
          <CardValue>{overall.bestStanding ?? "—"}</CardValue>
          <p className="text-xs text-muted mt-1">média: {overall.averageStanding || "—"}</p>
        </Card>
      </div>

      {/* Recent form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardTitle>Últimas 5 partidas</CardTitle>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{recentForm5.winRate}%</span>
            <span className="text-sm text-muted">
              {recentForm5.wins}W-{recentForm5.losses}L-{recentForm5.draws}D
            </span>
          </div>
        </Card>
        <Card>
          <CardTitle>Últimas 10 partidas</CardTitle>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{recentForm10.winRate}%</span>
            <span className="text-sm text-muted">
              {recentForm10.wins}W-{recentForm10.losses}L-{recentForm10.draws}D
            </span>
          </div>
        </Card>
      </div>

      {/* Win rate over time chart */}
      {breakdown.overTime.length >= 2 && (
        <Card>
          <CardTitle>Win Rate por Mês</CardTitle>
          <div className="mt-4 h-64">
            <WinRateChart data={breakdown.overTime} />
          </div>
        </Card>
      )}
      {breakdown.overTime.length < 2 && breakdown.overTime.length > 0 && (
        <Card>
          <CardTitle>Win Rate por Mês</CardTitle>
          <p className="text-sm text-muted mt-2">
            São necessários pelo menos 2 meses de dados para exibir o gráfico.
          </p>
        </Card>
      )}

      {/* Win rate by store */}
      {breakdown.byStore.length > 0 && (
        <Card>
          <CardTitle>Win Rate por Loja</CardTitle>
          <div className="mt-3">
            <GroupedTable data={breakdown.byStore} />
          </div>
        </Card>
      )}

      {/* Win rate by deck */}
      {breakdown.byDeck.length > 0 && (
        <Card>
          <CardTitle>Win Rate por Deck</CardTitle>
          <div className="mt-3">
            <GroupedTable data={breakdown.byDeck} />
          </div>
        </Card>
      )}
    </div>
  );
}
