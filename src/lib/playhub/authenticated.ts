/**
 * Authenticated PlayHub client.
 *
 * Uses the user's personal PlayHub token to access authenticated endpoints
 * like "my events" which are not available through the public API.
 *
 * IMPORTANT: The token is a session token from the user's browser login.
 * It may expire. The user is responsible for updating it when needed.
 * This endpoint is unofficial and may change without notice.
 */

import { PlayHubNetworkError, PlayHubValidationError } from "./errors";

const API_BASE = "https://api.ravensburgerplay.com/api/v2";

export interface UserEventStatus {
  id: number;
  eventId: number;
  eventName: string;
  startDate: string | null;
  registrationStatus: string;
  bestIdentifier: string;
}

interface RawUserEventStatus {
  id: number;
  user: number;
  best_identifier?: string;
  registration_status?: string;
  registration_completed_datetime?: string;
  event?: {
    id: number;
    name: string;
    start_datetime?: string;
  };
  [key: string]: unknown;
}

interface PaginatedResponse {
  count: number;
  total: number;
  current_page_number: number;
  next_page_number: number | null;
  page_size: number;
  results: RawUserEventStatus[];
}

/**
 * Fetch all events the authenticated user has participated in.
 * Paginates automatically to get all results.
 */
export async function fetchMyEvents(token: string): Promise<UserEventStatus[]> {
  const allEvents: UserEventStatus[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${API_BASE}/player/user-event-statuses/?game_slug=disney-lorcana&is_apart_of=true&ordering=default&page=${page}&page_size=100`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
          Accept: "*/*",
          Referer: "https://tcg.ravensburgerplay.com/",
        },
      });
    } catch (error) {
      throw new PlayHubNetworkError("fetchMyEvents", error);
    }

    if (response.status === 401 || response.status === 403) {
      throw new PlayHubValidationError(
        "fetchMyEvents",
        "Token inválido ou expirado. Atualize o token nas configurações."
      );
    }

    if (!response.ok) {
      throw new PlayHubNetworkError(
        "fetchMyEvents",
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    let data: PaginatedResponse;
    try {
      data = await response.json() as PaginatedResponse;
    } catch {
      throw new PlayHubValidationError("fetchMyEvents", "Resposta inválida da API");
    }

    for (const item of data.results) {
      if (item.event) {
        allEvents.push({
          id: item.id,
          eventId: item.event.id,
          eventName: item.event.name,
          startDate: item.event.start_datetime ?? null,
          registrationStatus: item.registration_status ?? "UNKNOWN",
          bestIdentifier: item.best_identifier ?? "Unknown",
        });
      }
    }

    hasMore = data.next_page_number !== null;
    page++;
  }

  return allEvents;
}

/**
 * Validate that a token works by making a minimal request.
 */
export async function validateToken(token: string): Promise<{ valid: boolean; userId?: number; name?: string }> {
  try {
    const url = `${API_BASE}/player/user-event-statuses/?game_slug=disney-lorcana&is_apart_of=true&page=1&page_size=1`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${token}`,
        Accept: "*/*",
        Referer: "https://tcg.ravensburgerplay.com/",
      },
    });

    if (response.status === 401 || response.status === 403) {
      return { valid: false };
    }

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json() as PaginatedResponse;
    const first = data.results[0];

    return {
      valid: true,
      userId: first?.user ?? undefined,
      name: first?.best_identifier ?? undefined,
    };
  } catch {
    return { valid: false };
  }
}

// --- Event Recap (includes deck info) ---

export interface EventRecap {
  eventId: number;
  eventName: string;
  deckId: string | null;
  deckName: string | null;
  currentRank: number | null;
  finalPlace: number | null;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  totalParticipants: number | null;
  storeName: string | null;
  gameplayFormatName: string | null;
}

/**
 * Fetch the event recap for the authenticated user.
 * Returns deck ID, placement, and match record.
 */
export async function fetchEventRecap(token: string, eventId: number): Promise<EventRecap | null> {
  try {
    const url = `${API_BASE}/player/events/${eventId}/recap/`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${token}`,
        Accept: "*/*",
        Referer: "https://tcg.ravensburgerplay.com/",
      },
    });

    if (!response.ok) return null;

    const data = await response.json() as Record<string, unknown>;

    const deck = data.deck as Record<string, unknown> | null;

    return {
      eventId: data.event_id as number,
      eventName: data.event_name as string,
      deckId: deck?.deck_id as string ?? null,
      deckName: deck?.deck_name as string ?? data.deck_name as string ?? null,
      currentRank: data.current_rank as number ?? null,
      finalPlace: data.final_place as number ?? null,
      matchesWon: data.matches_won as number ?? 0,
      matchesLost: data.matches_lost as number ?? 0,
      matchesDrawn: data.matches_drawn as number ?? 0,
      totalParticipants: data.total_participants as number ?? null,
      storeName: data.store_name as string ?? null,
      gameplayFormatName: data.gameplay_format_name as string ?? null,
    };
  } catch {
    return null;
  }
}

// --- Decklist ---

export interface DeckCardEntry {
  cardName: string;
  displayName: string;
  quantity: number;
  type: string | null;
  subtype: string | null;
  inkColor: string | null;
  rarity: string | null;
  setName: string | null;
  setCode: string | null;
  imageUrl: string | null;
  rulesText: string | null;
}

export interface DecklistData {
  deckId: string;
  deckName: string;
  cardCount: number;
  inkColors: string[];
  cards: DeckCardEntry[];
}

const DECKBUILDER_BASE = "https://api.cloudflare.ravensburgerplay.com/hydraproxy/api/v2";

/**
 * Fetch a full decklist by deck ID.
 * Uses the cloudflare proxy endpoint (same as the official site).
 */
export async function fetchDecklist(deckId: string, token?: string): Promise<DecklistData | null> {
  try {
    const url = `${DECKBUILDER_BASE}/deckbuilder/decks/${deckId}/`;
    const headers: Record<string, string> = {
      Accept: "*/*",
      Referer: "https://tcg.ravensburgerplay.com/",
    };
    if (token) {
      headers.Authorization = `Token ${token}`;
    }
    const response = await fetch(url, { headers });

    if (!response.ok) return null;

    const data = await response.json() as Record<string, unknown>;

    const sections = data.sections as Array<Record<string, unknown>> ?? [];
    const cards: DeckCardEntry[] = [];
    const inkColors = new Set<string>();

    for (const section of sections) {
      const sectionCards = section.cards as Array<Record<string, unknown>> ?? [];
      for (const entry of sectionCards) {
        const card = entry.card as Record<string, unknown>;
        const inkArray = card.ink_array as string[] ?? [];
        inkArray.forEach((c) => inkColors.add(c));

        cards.push({
          cardName: card.name as string ?? "Unknown",
          displayName: card.display_name as string ?? card.name as string ?? "Unknown",
          quantity: entry.quantity as number ?? 1,
          type: card.type as string ?? null,
          subtype: card.subtype as string ?? null,
          inkColor: inkArray[0] ?? null,
          rarity: card.rarity as string ?? null,
          setName: card.set_name as string ?? null,
          setCode: card.set_code as string ?? null,
          imageUrl: card.image_url as string ?? null,
          rulesText: card.rules_text as string ?? null,
        });
      }
    }

    return {
      deckId: data.id as string,
      deckName: data.name as string ?? "Unknown Deck",
      cardCount: data.card_count as number ?? cards.reduce((sum, c) => sum + c.quantity, 0),
      inkColors: Array.from(inkColors),
      cards,
    };
  } catch {
    return null;
  }
}
