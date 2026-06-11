import { Trophy, BarChart3, Download, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getStatsAction } from "@/server/actions/stats";
import { getPendingConfirmationsAction, getUserTournamentsAction } from "@/server/actions/tournaments";
import { getProfileAction } from "@/server/actions/profile";

export default async function HomePage() {
  const [statsResult, pendingResult, profileResult, tournamentsResult] = await Promise.all([
    getStatsAction(),
    getPendingConfirmationsAction(),
    getProfileAction(),
    getUserTournamentsAction(),
  ]);

  const stats = statsResult.data;
  const pending = pendingResult.data ?? [];
  const profile = profileResult.data;
  const tournaments = tournamentsResult.data ?? [];

  if (!profile) {
    return (
      <EmptyState
        icon={<Trophy size={48} />}
        title="Bem-vindo ao InkStats"
        description="Configure seu perfil para começar a rastrear seus resultados em torneios de Lorcana."
        actionLabel="Configurar Perfil"
        actionHref="/settings"
      />
    );
  }

  if (!stats || tournaments.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Olá, {profile.displayName}</h1>
        <EmptyState
          icon={<Download size={48} />}
          title="Nenhum torneio encontrado"
          description="Importe seus primeiros torneios para começar a ver suas estatísticas."
          actionLabel="Importar Torneios"
          actionHref="/import"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Olá, {profile.displayName}</h1>
        {pending.length > 0 && (
          <Link
            href="/tournaments"
            className="flex items-center gap-1.5 text-sm text-warning font-medium"
          >
            <AlertCircle size={16} />
            {pending.length} resultado(s) para confirmar
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardTitle>Torneios</CardTitle>
          <CardValue>{stats.overall.totalTournaments}</CardValue>
        </Card>
        <Card>
          <CardTitle>Win Rate</CardTitle>
          <CardValue className="text-accent">{stats.overall.winRate}%</CardValue>
        </Card>
        <Card>
          <CardTitle>Melhor Posição</CardTitle>
          <CardValue>{stats.overall.bestStanding ?? "—"}</CardValue>
        </Card>
        <Card>
          <CardTitle>Partidas</CardTitle>
          <CardValue>{stats.overall.totalMatches}</CardValue>
        </Card>
      </div>

      {/* Recent form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardTitle>Últimas 5 partidas</CardTitle>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold">{stats.recentForm5.winRate}%</span>
            <span className="text-sm text-muted">
              {stats.recentForm5.wins}W-{stats.recentForm5.losses}L-{stats.recentForm5.draws}D
            </span>
          </div>
        </Card>
        <Card>
          <CardTitle>Últimas 10 partidas</CardTitle>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold">{stats.recentForm10.winRate}%</span>
            <span className="text-sm text-muted">
              {stats.recentForm10.wins}W-{stats.recentForm10.losses}L-{stats.recentForm10.draws}D
            </span>
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/tournaments" className="group">
          <Card className="transition-colors group-hover:border-accent/50">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-accent" />
              <div>
                <p className="font-medium text-sm">Torneios</p>
                <p className="text-xs text-muted">{tournaments.length} registrados</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/stats" className="group">
          <Card className="transition-colors group-hover:border-accent/50">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-accent" />
              <div>
                <p className="font-medium text-sm">Estatísticas</p>
                <p className="text-xs text-muted">Ver análise completa</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/import" className="group">
          <Card className="transition-colors group-hover:border-accent/50">
            <div className="flex items-center gap-3">
              <Download size={20} className="text-accent" />
              <div>
                <p className="font-medium text-sm">Importar</p>
                <p className="text-xs text-muted">Buscar novos eventos</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
