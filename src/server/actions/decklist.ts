"use server";

import { prisma } from "@/lib/db/prisma";
import { getPlayerProfile } from "@/lib/db";
import { fetchEventRecap, fetchDecklist } from "@/lib/playhub";

export async function importDecklistAction(eventId: string, resultId: string) {
  try {
    const profile = await getPlayerProfile();
    if (!profile?.playHubToken) {
      return { data: null, error: "Token PlayHub não configurado." };
    }

    // Get event recap to find deck ID
    const recap = await fetchEventRecap(profile.playHubToken, Number(eventId));
    if (!recap || !recap.deckId) {
      return { data: null, error: "Nenhuma decklist encontrada para este evento." };
    }

    // Fetch the full decklist from PlayHub
    const decklist = await fetchDecklist(recap.deckId, profile.playHubToken);
    if (!decklist) {
      return { data: null, error: "Não foi possível carregar a decklist." };
    }

    // Update the tournament result with deck info
    await prisma.tournamentResult.update({
      where: { id: resultId },
      data: {
        deckId: decklist.deckId,
        deckName: decklist.deckName,
        inkColors: decklist.inkColors.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(","),
      },
    });

    // Delete any existing deck cards for this result
    await prisma.deckCard.deleteMany({ where: { resultId } });

    // Fetch permanent image URLs from Lorcast
    // PlayHub gives us set_code ("set10") and collector_number ("204 EN 10")
    // Lorcast wants set code "10" and number "204"
    const cardsWithImages = [];
    for (const card of decklist.cards) {
      let imageUrl: string | null = null;
      let cost: number | null = null;
      let inkable: boolean | null = null;

      if (card.displayName) {
        const lorcastData = await fetchLorcastCardByName(card.displayName);
        imageUrl = lorcastData.imageUrl;
        cost = lorcastData.cost;
        inkable = lorcastData.inkable;
        // Rate limit: 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      cardsWithImages.push({ ...card, imageUrl, cost, inkable });
    }

    // Save deck cards with image URLs from lorcana-api.com
    await prisma.deckCard.createMany({
      data: cardsWithImages.map((card) => ({
        resultId,
        cardName: card.cardName,
        displayName: card.displayName,
        quantity: card.quantity,
        cost: card.cost,
        inkable: card.inkable,
        type: card.type,
        subtype: card.subtype,
        inkColor: card.inkColor ? card.inkColor.charAt(0).toUpperCase() + card.inkColor.slice(1) : null,
        rarity: card.rarity,
        setName: card.setName,
        setCode: card.setCode,
        imageUrl: card.imageUrl,
        rulesText: card.rulesText,
      })),
    });

    return {
      data: {
        deckName: decklist.deckName,
        inkColors: decklist.inkColors,
        cardCount: decklist.cardCount,
        cardsImported: cardsWithImages.length,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao importar decklist.";
    return { data: null, error: message };
  }
}

/**
 * Fetch card data from Lorcast API by display name.
 * Returns cost, inkwell (inkable), image URL.
 * Lorcast display name format: "Name" + "Version" (searched as "Name Version")
 */
async function fetchLorcastCardByName(displayName: string): Promise<{ imageUrl: string | null; cost: number | null; inkable: boolean | null }> {
  try {
    // PlayHub display name: "Judy Hopps - Lead Detective" → search "Judy Hopps Lead Detective"
    const searchTerms = displayName.replace(" - ", " ");
    const query = encodeURIComponent(searchTerms);
    const response = await fetch(`https://api.lorcast.com/v0/cards/search?q=${query}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return { imageUrl: null, cost: null, inkable: null };
    const data = await response.json() as {
      results?: Array<{
        name?: string;
        version?: string;
        cost?: number | null;
        inkwell?: boolean;
        image_uris?: { digital?: { normal?: string } };
      }>;
    };
    const card = data.results?.[0];
    if (!card) return { imageUrl: null, cost: null, inkable: null };
    return {
      imageUrl: card.image_uris?.digital?.normal ?? null,
      cost: card.cost ?? null,
      inkable: card.inkwell ?? null,
    };
  } catch {
    return { imageUrl: null, cost: null, inkable: null };
  }
}

export async function getDecklistAction(resultId: string) {
  try {
    const cards = await prisma.deckCard.findMany({
      where: { resultId },
      orderBy: [{ type: "asc" }, { cardName: "asc" }],
    });
    return { data: cards, error: null };
  } catch {
    return { data: null, error: "Erro ao carregar decklist." };
  }
}

/**
 * Import a decklist from pasted text.
 * Format: "4 Maximus - Team Champion" per line (quantity + space + card name).
 * Fetches card data (cost, inkable, image) from Lorcast for each card.
 */
export async function importManualDecklistAction(resultId: string, deckName: string, text: string) {
  try {
    // Parse the pasted text
    const lines = text.trim().split("\n").filter((l) => l.trim());
    const parsedCards: Array<{ quantity: number; displayName: string }> = [];

    for (const line of lines) {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (match) {
        parsedCards.push({
          quantity: parseInt(match[1], 10),
          displayName: match[2].trim(),
        });
      }
    }

    if (parsedCards.length === 0) {
      return { data: null, error: "Não foi possível interpretar a decklist. Use o formato: '4 Nome da Carta'" };
    }

    // Delete existing deck cards
    await prisma.deckCard.deleteMany({ where: { resultId } });

    // Fetch card data from Lorcast for each card
    const cardsWithData = [];
    for (const card of parsedCards) {
      const lorcastData = await fetchLorcastCardByName(card.displayName);
      cardsWithData.push({
        cardName: card.displayName.split(" - ")[0] ?? card.displayName,
        displayName: card.displayName,
        quantity: card.quantity,
        cost: lorcastData.cost,
        inkable: lorcastData.inkable,
        imageUrl: lorcastData.imageUrl,
        type: null,
        subtype: null,
        inkColor: null,
        rarity: null,
        setName: null,
        setCode: null,
        rulesText: null,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Save to DB
    await prisma.deckCard.createMany({
      data: cardsWithData.map((card) => ({
        resultId,
        ...card,
      })),
    });

    // Update deck name if provided
    if (deckName) {
      await prisma.tournamentResult.update({
        where: { id: resultId },
        data: { deckName, updatedAt: new Date() },
      });
    }

    return {
      data: { cardsImported: cardsWithData.length, deckName },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao importar decklist manual.";
    return { data: null, error: message };
  }
}
