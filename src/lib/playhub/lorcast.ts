/**
 * Lorcast API integration for card images.
 * 
 * Lorcast provides permanent CDN URLs for Lorcana card images
 * that don't expire (unlike the signed Google Storage URLs from PlayHub).
 *
 * API: https://api.lorcast.com/v0
 * Images: https://cards.lorcast.io
 * Rate limit: 10 req/sec
 */

const LORCAST_API = "https://api.lorcast.com/v0";

interface LorcastCard {
  id: string;
  name: string;
  version: string | null;
  image_uris?: {
    digital?: {
      small?: string;
      normal?: string;
      large?: string;
    };
  };
  ink: string | null;
  cost: number | null;
  rarity: string | null;
  set?: {
    code: string;
    name: string;
  };
}

/**
 * Fetch a card from Lorcast by set code and collector number.
 * Set code is just the number (e.g. "5" for Set 5).
 * Collector number is the card number in the set (e.g. "204").
 */
export async function fetchLorcastCard(setCode: string, collectorNumber: string): Promise<LorcastCard | null> {
  try {
    const response = await fetch(`${LORCAST_API}/cards/${setCode}/${collectorNumber}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return await response.json() as LorcastCard;
  } catch {
    return null;
  }
}

/**
 * Parse PlayHub's set_code (e.g. "set5") into Lorcast format (e.g. "5").
 */
export function parseSetCode(playHubSetCode: string): string {
  // "set5" -> "5", "set10" -> "10", "set11" -> "11"
  return playHubSetCode.replace(/^set/i, "");
}

/**
 * Parse PlayHub's collector_number (e.g. "204 EN 5") into just the number (e.g. "204").
 */
export function parseCollectorNumber(playHubCollectorNumber: string): string {
  // "204 EN 5" -> "204", "C1 EN 1" -> "C1"
  const parts = playHubCollectorNumber.split(" ");
  return parts[0] ?? playHubCollectorNumber;
}

/**
 * Get a permanent Lorcast image URL for a card.
 * Returns the "normal" size (488x681 AVIF).
 */
export async function getCardImageUrl(
  setCode: string,
  collectorNumber: string
): Promise<string | null> {
  const lorcastSet = parseSetCode(setCode);
  const lorcastNumber = parseCollectorNumber(collectorNumber);

  const card = await fetchLorcastCard(lorcastSet, lorcastNumber);
  if (!card?.image_uris?.digital?.normal) return null;
  return card.image_uris.digital.normal;
}

/**
 * Batch fetch image URLs for multiple cards.
 * Respects rate limit with 100ms delay between requests.
 */
export async function batchGetCardImages(
  cards: Array<{ setCode: string; collectorNumber: string }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const card of cards) {
    const key = `${card.setCode}:${card.collectorNumber}`;
    const url = await getCardImageUrl(card.setCode, card.collectorNumber);
    if (url) {
      results.set(key, url);
    }
    // Respect Lorcast rate limit: 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
