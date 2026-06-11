/**
 * PlayHub integration layer for InkStats.
 *
 * All PlayHub API access is isolated in this module.
 * The rest of the app should import from here — never from
 * "unofficial-ravensburger-playhub-api" directly.
 *
 * DISCLAIMER: The Ravensburger PlayHub API is unofficial and may change
 * at any time. This layer normalizes responses and handles failures gracefully.
 */

// Client functions
export { searchLorcanaEvents, getPlayHubEventDetails, getPlayHubEventStandings } from "./client";

// Authenticated client
export { fetchMyEvents, validateToken, fetchEventRecap, fetchDecklist } from "./authenticated";
export type { UserEventStatus, EventRecap, DeckCardEntry, DecklistData } from "./authenticated";

// Normalization (for testing/reuse)
export { normalizePlayHubEvent, normalizePlayHubStandings, normalizeRoundMatch } from "./normalize";

// Matching
export { findPotentialUserResults } from "./matching";

// Errors
export { PlayHubError, PlayHubNetworkError, PlayHubValidationError, PlayHubNotFoundError } from "./errors";

// Types
export type {
  SearchEventsParams,
  EventSearchResponse,
  NormalizedEvent,
  NormalizedEventDetails,
  NormalizedStanding,
  NormalizedMatch,
  NormalizedRound,
  PotentialUserResult,
  MatchConfidence,
} from "./types";
