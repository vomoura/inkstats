"use server";

import { prisma } from "@/lib/db/prisma";
import { computeOverallStats, computeBreakdownStats, computeRecentForms } from "@/lib/stats";
import type { TournamentRecord, MatchRecord } from "@/lib/stats";

export async function getStatsAction() {
  try {
    // Get confirmed user results
    const results = await prisma.tournamentResult.findMany({
      where: { isUserResult: true, needsConfirmation: false },
      include: { event: true },
    });

    // Get user matches (excluding UNKNOWN)
    const matches = await prisma.match.findMany({
      where: { isUserMatch: true, result: { not: "UNKNOWN" } },
      include: { event: true },
      orderBy: [{ event: { startDate: "desc" } }, { roundNumber: "desc" }],
    });

    // Map to stats input types
    const tournamentRecords: TournamentRecord[] = results.map((r) => ({
      eventId: r.eventId,
      eventName: r.event.name,
      storeName: r.event.storeName,
      date: r.event.startDate,
      standing: r.standing,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      deckName: r.deckName,
      totalPlayers: r.event.totalPlayers,
    }));

    const matchRecords: MatchRecord[] = matches.map((m) => ({
      eventId: m.eventId,
      roundNumber: m.roundNumber,
      opponentName: m.opponentName,
      result: m.result as "WIN" | "LOSS" | "DRAW",
      date: m.event.startDate,
    }));

    const overall = computeOverallStats(tournamentRecords);
    const breakdown = computeBreakdownStats(tournamentRecords);
    const { recentForm5, recentForm10 } = computeRecentForms(matchRecords);

    return {
      data: { overall, breakdown, recentForm5, recentForm10 },
      error: null,
    };
  } catch {
    return { data: null, error: "Erro ao calcular estatísticas." };
  }
}
