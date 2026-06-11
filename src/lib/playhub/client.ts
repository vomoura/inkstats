/**
 * PlayHub client — the single point of contact with the Ravensburger PlayHub API.
 *
 * IMPORTANT: This API is unofficial and undocumented. Endpoints may change,
 * rate limits may apply, and responses may vary without notice.
 * All functions return normalized InkStats types — raw API objects never leave this module.
 *
 * Error handling: all functions throw typed PlayHubError subclasses, never unhandled crashes.
 */

import {
  searchEventsByCity,
  searchEventsByStore,
  fetchEventDetails,
  getEventStandings,
  fetchTournamentRoundMatches,
  getCategoryName,
} from "unofficial-ravensburger-playhub-api";
import type { Event as PlayHubEvent } from "unofficial-ravensburger-playhub-api";
import { PlayHubNetworkError, PlayHubNotFoundError, PlayHubValidationError } from "./errors";
import {
  normalizePlayHubEvent,
  normalizePlayHubStandings,
  normalizeRoundMatch,
  buildNormalizedEventDetails,
} from "./normalize";
import type {
  SearchEventsParams,
  EventSearchResponse,
  NormalizedEventDetails,
  NormalizedStanding,
  NormalizedRound,
} from "./types";
import { SearchEventsParamsSchema } from "./types";

/**
 * Search for Lorcana events by city or store.
 * Returns normalized event summaries suitable for display.
 */
export async function searchLorcanaEvents(
  params: SearchEventsParams
): Promise<EventSearchResponse> {
  const validated = SearchEventsParamsSchema.parse(params);

  try {
    let result;

    if (validated.storeId) {
      result = await searchEventsByStore({
        storeId: validated.storeId,
        statuses: validated.statuses,
        startDate: validated.startDate,
        endDate: validated.endDate,
        pageSize: validated.pageSize,
        page: validated.page,
      });
    } else if (validated.city) {
      result = await searchEventsByCity({
        city: validated.city,
        radiusMiles: validated.radiusMiles,
        statuses: validated.statuses,
        startDate: validated.startDate,
        endDate: validated.endDate,
        pageSize: validated.pageSize,
        page: validated.page,
      });
    } else {
      throw new PlayHubValidationError(
        "searchLorcanaEvents",
        "Either city or storeId is required"
      );
    }

    if ("error" in result) {
      throw new PlayHubNetworkError("searchLorcanaEvents", result.error);
    }

    const events = result.events.map((e: PlayHubEvent) => {
      const normalized = normalizePlayHubEvent(e);
      // Try to resolve category name from template ID
      if (normalized.category && !normalized.category.includes(" ")) {
        try {
          const name = getCategoryName(normalized.category);
          if (name !== normalized.category) {
            normalized.category = name;
          }
        } catch {
          // Category name resolution is best-effort
        }
      }
      return normalized;
    });

    return {
      events,
      total: result.total,
      currentPage: result.currentPage,
      nextPage: result.nextPage,
    };
  } catch (error) {
    if (error instanceof PlayHubNetworkError || error instanceof PlayHubValidationError) {
      throw error;
    }
    throw new PlayHubNetworkError("searchLorcanaEvents", error);
  }
}

/**
 * Get full event details including standings from the latest completed round.
 * Returns normalized data ready for import.
 */
export async function getPlayHubEventDetails(
  eventId: number
): Promise<NormalizedEventDetails> {
  try {
    const raw = await fetchEventDetails(eventId);
    if (!raw) {
      throw new PlayHubNotFoundError("Event", eventId);
    }

    const normalized = normalizePlayHubEvent(raw);

    // Get standings
    const standings = await getPlayHubEventStandings(eventId);

    // Get round matches if tournament phases exist
    const rounds: NormalizedRound[] = [];
    if (raw.tournament_phases && raw.tournament_phases.length > 0) {
      for (const phase of raw.tournament_phases) {
        for (const round of phase.rounds) {
          try {
            const matchesResponse = await fetchTournamentRoundMatches(
              round.id,
              1,
              100
            );
            const normalizedMatches = matchesResponse.results.flatMap((m) =>
              normalizeRoundMatch(m, round.round_number)
            );
            if (normalizedMatches.length > 0) {
              rounds.push({
                roundNumber: round.round_number,
                roundId: round.id,
                matches: normalizedMatches,
              });
            }
          } catch {
            // Round match data is optional — skip if unavailable
          }
        }
      }
    }

    return buildNormalizedEventDetails(normalized, standings, rounds);
  } catch (error) {
    if (
      error instanceof PlayHubNetworkError ||
      error instanceof PlayHubNotFoundError ||
      error instanceof PlayHubValidationError
    ) {
      throw error;
    }
    throw new PlayHubNetworkError("getPlayHubEventDetails", error);
  }
}

/**
 * Get standings for an event from its latest completed round.
 * Returns normalized standings entries.
 */
export async function getPlayHubEventStandings(
  eventId: number
): Promise<NormalizedStanding[]> {
  try {
    const result = await getEventStandings(eventId, 100);
    if (!result || !result.standings) {
      return [];
    }
    return normalizePlayHubStandings(result.standings);
  } catch (error) {
    if (error instanceof PlayHubNetworkError) throw error;
    // Standings may not exist for all events — return empty gracefully
    return [];
  }
}
