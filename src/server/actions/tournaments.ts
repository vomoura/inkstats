"use server";

import { prisma } from "@/lib/db/prisma";
import { confirmTournamentResult, getEventById, listEvents } from "@/lib/db";

export async function getEventsAction() {
  try {
    const events = await listEvents();
    return { data: events, error: null };
  } catch {
    return { data: null, error: "Erro ao carregar torneios." };
  }
}

export async function getEventDetailAction(id: string) {
  try {
    const event = await getEventById(id);
    if (!event) {
      return { data: null, error: "Evento não encontrado." };
    }
    return { data: event, error: null };
  } catch {
    return { data: null, error: "Erro ao carregar detalhes do evento." };
  }
}

export async function getUserTournamentsAction() {
  try {
    const results = await prisma.tournamentResult.findMany({
      where: { isUserResult: true, needsConfirmation: false },
      include: { event: true },
      orderBy: { event: { startDate: "desc" } },
    });
    return { data: results, error: null };
  } catch {
    return { data: null, error: "Erro ao carregar seus torneios." };
  }
}

export async function confirmResultAction(resultId: string, confirm: boolean) {
  try {
    const result = await confirmTournamentResult(resultId, confirm);
    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao confirmar resultado.";
    return { data: null, error: message };
  }
}

export async function getPendingConfirmationsAction() {
  try {
    const results = await prisma.tournamentResult.findMany({
      where: { needsConfirmation: true },
      include: { event: true },
      orderBy: { event: { startDate: "desc" } },
    });
    return { data: results, error: null };
  } catch {
    return { data: null, error: "Erro ao carregar confirmações pendentes." };
  }
}

export async function updateDeckMetadataAction(
  resultId: string,
  data: { deckName: string; inkColors: string; notes: string }
) {
  try {
    const result = await prisma.tournamentResult.update({
      where: { id: resultId },
      data: {
        deckName: data.deckName || null,
        inkColors: data.inkColors || null,
        notes: data.notes || null,
      },
    });
    return { data: result, error: null };
  } catch {
    return { data: null, error: "Erro ao salvar informações do deck." };
  }
}
