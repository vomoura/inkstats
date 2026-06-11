/**
 * Normalization functions that convert raw PlayHub API objects into InkStats types.
 *
 * IMPORTANT: The Ravensburger PlayHub API is unofficial and undocumented.
 * Response shapes may change without notice. These normalizers handle missing/null
 * fields gracefully and never throw on unexpected data — they degrade safely.
 */

import type { Event as PlayHubEvent, StandingEntry, RoundMatchEntry } from "unofficial-ravensburger-playhub-api";
import type { NormalizedEvent, NormalizedStanding, NormalizedMatch, NormalizedEventDetails, NormalizedRound } from "./types";

/**
 * Extract the best available player name from a standings entry.
 * The PlayHub API stores names in multiple inconsistent fields.
 */
function extractPlayerName(entry: StandingEntry): string {
  return (
    entry.player_name ??
    entry.display_name ??
    entry.username ??
    entry.user_event_status?.best_identifier ??
    entry.player?.best_identifier ??
    "Unknown Player"
  );
}

/**
 * Parse a record string like "3-1-0" into wins/losses/draws.
 */
function parseRecord(record: string | undefined | null): { wins: number; losses: number; draws: number } | null {
  if (!record) return null;
  const parts = record.split("-").map(Number);
  if (parts.length >= 3 && parts.every((n) => !isNaN(n))) {
    return { wins: parts[0], losses: parts[1], draws: parts[2] };
  }
  if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
    return { wins: parts[0], losses: parts[1], draws: 0 };
  }
  return null;
}

/**
 * Normalize a raw PlayHub event into InkStats format.
 * Handles missing fields safely.
 */
export function normalizePlayHubEvent(raw: PlayHubEvent): NormalizedEvent {
  return {
    id: raw.id,
    name: raw.name ?? "Unnamed Event",
    storeName: raw.store?.name ?? null,
    city: raw.store?.city ?? null,
    startDate: raw.start_datetime ?? null,
    format: raw.gameplay_format?.name ?? raw.event_format ?? null,
    category: raw.event_configuration_template ?? null,
    totalPlayers: raw.starting_player_count ?? raw.registered_user_count ?? null,
    status: raw.display_status ?? null,
  };
}

/**
 * Normalize raw PlayHub standings entries into InkStats format.
 * Extracts wins/losses/draws from either explicit fields or record string.
 */
export function normalizePlayHubStandings(rawStandings: StandingEntry[]): NormalizedStanding[] {
  return rawStandings.map((entry, index) => {
    const playerName = extractPlayerName(entry);
    const standing = entry.placement ?? entry.rank ?? index + 1;
    const points = entry.match_points ?? null;

    // Try explicit wins/losses first, then parse record string
    let wins = entry.wins ?? 0;
    let losses = entry.losses ?? 0;
    let draws = 0;

    const parsed = parseRecord(entry.record ?? entry.match_record);
    if (parsed) {
      wins = parsed.wins;
      losses = parsed.losses;
      draws = parsed.draws;
    }

    return {
      playerName,
      standing,
      wins,
      losses,
      draws,
      points,
    };
  });
}

/**
 * Normalize a single round match entry into InkStats match records.
 * A single RoundMatchEntry produces two NormalizedMatch records (one per player).
 */
export function normalizeRoundMatch(
  entry: RoundMatchEntry,
  roundNumber: number
): NormalizedMatch[] {
  const relationships = entry.player_match_relationships ?? [];
  if (relationships.length < 2) {
    // Byes or incomplete data
    if (relationships.length === 1) {
      const player = relationships[0];
      const playerName =
        player.user_event_status?.best_identifier ??
        player.player?.best_identifier ??
        "Unknown Player";

      return [
        {
          roundNumber,
          playerName,
          opponentName: null,
          result: entry.match_is_bye ? "WIN" : "UNKNOWN",
          score: null,
        },
      ];
    }
    return [];
  }

  const [p1, p2] = relationships;
  const p1Name =
    p1.user_event_status?.best_identifier ??
    p1.player?.best_identifier ??
    "Unknown Player";
  const p2Name =
    p2.user_event_status?.best_identifier ??
    p2.player?.best_identifier ??
    "Unknown Player";

  const winnerId = entry.winning_player;
  const isDraw =
    entry.match_is_intentional_draw || entry.match_is_unintentional_draw || winnerId === null;

  let p1Result: "WIN" | "LOSS" | "DRAW" | "UNKNOWN";
  let p2Result: "WIN" | "LOSS" | "DRAW" | "UNKNOWN";

  if (isDraw) {
    p1Result = "DRAW";
    p2Result = "DRAW";
  } else if (winnerId === p1.player?.id) {
    p1Result = "WIN";
    p2Result = "LOSS";
  } else if (winnerId === p2.player?.id) {
    p1Result = "LOSS";
    p2Result = "WIN";
  } else {
    p1Result = "UNKNOWN";
    p2Result = "UNKNOWN";
  }

  const score = buildScore(entry);

  return [
    {
      roundNumber,
      playerName: p1Name,
      opponentName: p2Name,
      result: p1Result,
      score,
    },
    {
      roundNumber,
      playerName: p2Name,
      opponentName: p1Name,
      result: p2Result,
      score: score ? reverseScore(score) : null,
    },
  ];
}

function buildScore(entry: RoundMatchEntry): string | null {
  const w = entry.games_won_by_winner;
  const l = entry.games_won_by_loser;
  if (w != null && l != null) {
    return `${w}-${l}`;
  }
  return null;
}

function reverseScore(score: string): string {
  const parts = score.split("-");
  if (parts.length === 2) return `${parts[1]}-${parts[0]}`;
  return score;
}

/**
 * Build a full NormalizedEventDetails combining event info, standings, and round matches.
 */
export function buildNormalizedEventDetails(
  event: NormalizedEvent,
  standings: NormalizedStanding[],
  rounds: NormalizedRound[]
): NormalizedEventDetails {
  return {
    id: event.id,
    name: event.name,
    storeName: event.storeName,
    city: event.city,
    startDate: event.startDate,
    format: event.format,
    category: event.category,
    totalPlayers: event.totalPlayers ?? (standings.length || null),
    standings,
    rounds,
  };
}
