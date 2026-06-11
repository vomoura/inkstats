"use server";

import { prisma } from "@/lib/db/prisma";
import { getPlayerProfile } from "@/lib/db";
import { fetchEventRecap, fetchDecklist } from "@/lib/playhub";
import { parseSetCode, parseCollectorNumber, fetchLorcastCard } from "@/lib/playhub/lorcast";

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

      if (card.setCode) {
        const lorcastSet = parseSetCode(card.setCode);
        // collector_number from PlayHub is in format "204 EN 10" - we need just "204"
        // But we don't have collector_number in our DeckCardEntry type yet
        // Use search by name as fallback
        const lorcastCard = await fetchLorcastCardByName(card.displayName);
        imageUrl = lorcastCard;
        // Rate limit: 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      cardsWithImages.push({ ...card, imageUrl });
    }

    // Save deck cards with Lorcast image URLs
    await prisma.deckCard.createMany({
      data: cardsWithImages.map((card) => ({
        resultId,
        cardName: card.cardName,
        displayName: card.displayName,
        quantity: card.quantity,
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
 * Search Lorcast by card display name and return the normal image URL.
 * Display name format from PlayHub: "Name - Version" (e.g. "Judy Hopps - Lead Detective")
 */
async function fetchLorcastCardByName(displayName: string): Promise<string | null> {
  try {
    // PlayHub display name is "Name - Version", Lorcast expects just the words
    const searchTerms = displayName.replace(" - ", " ");
    const query = encodeURIComponent(searchTerms);
    const response = await fetch(`https://api.lorcast.com/v0/cards/search?q=${query}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json() as {
      results?: Array<{
        name?: string;
        version?: string;
        image_uris?: { digital?: { normal?: string } };
      }>;
    };
    const card = data.results?.[0];
    return card?.image_uris?.digital?.normal ?? null;
  } catch {
    return null;
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
