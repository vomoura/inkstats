"use server";

import { searchLorcanaEvents, getPlayHubEventDetails, findPotentialUserResults, fetchMyEvents } from "@/lib/playhub";
import { saveImportedEvent, getPlayerProfile, getEventById } from "@/lib/db";
import type { SearchEventsParams } from "@/lib/playhub";

export async function searchEventsAction(params: SearchEventsParams) {
  try {
    const result = await searchLorcanaEvents(params);
    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar eventos.";
    return { data: null, error: message };
  }
}

export async function fetchMyEventsAction() {
  try {
    const profile = await getPlayerProfile();
    if (!profile?.playHubToken) {
      return { data: null, error: "Token PlayHub não configurado. Vá em Configurações para adicionar." };
    }

    const events = await fetchMyEvents(profile.playHubToken);
    return { data: events, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar seus eventos.";
    return { data: null, error: message };
  }
}

export async function importEventAction(eventId: number) {
  try {
    // Check if already imported
    const existing = await getEventById(String(eventId));
    if (existing) {
      return { data: null, error: "Este evento já foi importado.", alreadyImported: true };
    }

    // Fetch full event details from PlayHub
    const details = await getPlayHubEventDetails(eventId);

    // Get user aliases for matching
    const profile = await getPlayerProfile();
    const aliases = profile?.aliases.map((a) => a.value) ?? [];
    const aliasesLower = aliases.map((a) => a.toLowerCase().trim());

    // Find potential user results
    const potentialMatches = findPotentialUserResults(details.standings, aliases);

    // Save event to local DB
    const savedEvent = await saveImportedEvent({
      id: String(details.id),
      name: details.name,
      storeName: details.storeName,
      city: details.city,
      startDate: details.startDate ? new Date(details.startDate) : null,
      format: details.format,
      category: details.category,
      totalPlayers: details.totalPlayers,
      results: details.standings.map((s) => {
        const match = potentialMatches.find((m) => m.playerName === s.playerName);
        if (match && match.confidence === "exact") {
          return {
            playerName: s.playerName,
            standing: s.standing,
            wins: s.wins,
            losses: s.losses,
            draws: s.draws,
            points: s.points,
            matchedAlias: match.matchedAlias,
            isUserResult: true,
            needsConfirmation: false,
          };
        }
        if (match && match.confidence === "partial") {
          return {
            playerName: s.playerName,
            standing: s.standing,
            wins: s.wins,
            losses: s.losses,
            draws: s.draws,
            points: s.points,
            matchedAlias: match.matchedAlias,
            isUserResult: false,
            needsConfirmation: true,
          };
        }
        // No match — not the user, no confirmation needed
        return {
          playerName: s.playerName,
          standing: s.standing,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          points: s.points,
          isUserResult: false,
          needsConfirmation: false,
        };
      }),
      matches: details.rounds.flatMap((round) =>
        round.matches.map((m) => {
          const isUser = aliasesLower.includes(m.playerName.toLowerCase().trim());
          return {
            roundNumber: m.roundNumber,
            playerName: m.playerName,
            opponentName: m.opponentName,
            result: m.result,
            score: m.score,
            isUserMatch: isUser,
          };
        })
      ),
    });

    return {
      data: {
        event: savedEvent,
        potentialMatches: potentialMatches.filter((m) => m.confidence === "partial"),
        confirmedMatches: potentialMatches.filter((m) => m.confidence === "exact"),
      },
      error: null,
      alreadyImported: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao importar evento.";
    return { data: null, error: message, alreadyImported: false };
  }
}
