import { prisma } from "../prisma";
import { DatabaseError, DuplicateError, NotFoundError } from "../errors";
import type { Event, TournamentResult, Match, MatchResult } from "@/generated/prisma/client";

export type EventWithResults = Event & {
  results: TournamentResult[];
  matches: Match[];
};

export type ImportEventData = {
  id: string;
  name: string;
  storeName?: string | null;
  city?: string | null;
  startDate?: Date | null;
  format?: string | null;
  category?: string | null;
  totalPlayers?: number | null;
  results?: Array<{
    playerName: string;
    standing?: number | null;
    wins?: number;
    losses?: number;
    draws?: number;
    points?: number | null;
    matchedAlias?: string | null;
    isUserResult?: boolean;
    needsConfirmation?: boolean;
  }>;
  matches?: Array<{
    roundNumber?: number | null;
    playerName: string;
    opponentName?: string | null;
    result: MatchResult;
    score?: string | null;
    isUserMatch?: boolean;
  }>;
};

export async function listEvents(): Promise<Event[]> {
  try {
    return await prisma.event.findMany({
      orderBy: { startDate: "desc" },
    });
  } catch (error) {
    throw new DatabaseError("Failed to list events", "read", error);
  }
}

export async function getEventById(id: string): Promise<EventWithResults | null> {
  try {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        results: { orderBy: { standing: "asc" } },
        matches: { orderBy: { roundNumber: "asc" } },
      },
    });
  } catch (error) {
    throw new DatabaseError("Failed to retrieve event", "read", error);
  }
}

export async function saveImportedEvent(data: ImportEventData): Promise<EventWithResults> {
  try {
    const existing = await prisma.event.findUnique({ where: { id: data.id } });
    if (existing) {
      throw new DuplicateError("Event", "id", data.id);
    }

    return await prisma.event.create({
      data: {
        id: data.id,
        name: data.name,
        storeName: data.storeName ?? null,
        city: data.city ?? null,
        startDate: data.startDate ?? null,
        format: data.format ?? null,
        category: data.category ?? null,
        totalPlayers: data.totalPlayers ?? null,
        results: data.results
          ? {
              create: data.results.map((r) => ({
                playerName: r.playerName,
                standing: r.standing ?? null,
                wins: r.wins ?? 0,
                losses: r.losses ?? 0,
                draws: r.draws ?? 0,
                points: r.points ?? null,
                matchedAlias: r.matchedAlias ?? null,
                isUserResult: r.isUserResult ?? false,
                needsConfirmation: r.needsConfirmation ?? false,
                updatedAt: new Date(),
              })),
            }
          : undefined,
        matches: data.matches
          ? {
              create: data.matches.map((m) => ({
                roundNumber: m.roundNumber ?? null,
                playerName: m.playerName,
                opponentName: m.opponentName ?? null,
                result: m.result,
                score: m.score ?? null,
                isUserMatch: m.isUserMatch ?? false,
              })),
            }
          : undefined,
      },
      include: {
        results: { orderBy: { standing: "asc" } },
        matches: { orderBy: { roundNumber: "asc" } },
      },
    });
  } catch (error) {
    if (error instanceof DuplicateError) throw error;
    throw new DatabaseError("Failed to save imported event", "write", error);
  }
}

export async function confirmTournamentResult(
  resultId: string,
  confirm: boolean
): Promise<TournamentResult> {
  try {
    const result = await prisma.tournamentResult.findUnique({
      where: { id: resultId },
    });

    if (!result) {
      throw new NotFoundError("TournamentResult", resultId);
    }

    return await prisma.tournamentResult.update({
      where: { id: resultId },
      data: {
        isUserResult: confirm,
        needsConfirmation: false,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError("Failed to confirm tournament result", "write", error);
  }
}
