/**
 * Player matching logic.
 *
 * Compares event standings against user aliases to find the user's results.
 * Uses case-insensitive exact match for "confirmed" and substring match for "needsConfirmation".
 *
 * IMPORTANT: Never assume a match is correct by name alone.
 * Exact matches are auto-confirmed, but partial matches require user confirmation.
 */

import type { NormalizedStanding, PotentialUserResult, MatchConfidence } from "./types";

const MIN_SUBSTRING_LENGTH = 3;

/**
 * Find potential user results in a list of standings by comparing player names
 * against the user's configured aliases.
 *
 * @param standings - Normalized event standings
 * @param aliases - User's configured aliases (raw strings from DB)
 * @returns Array of potential matches with confidence level
 */
export function findPotentialUserResults(
  standings: NormalizedStanding[],
  aliases: string[]
): PotentialUserResult[] {
  if (aliases.length === 0 || standings.length === 0) {
    return [];
  }

  const normalizedAliases = aliases.map((a) => a.trim().toLowerCase());
  const results: PotentialUserResult[] = [];
  const matched = new Set<number>(); // track indices to avoid duplicates

  for (let i = 0; i < standings.length; i++) {
    const entry = standings[i];
    const normalizedName = entry.playerName.trim().toLowerCase();

    // First pass: exact match (case-insensitive, trimmed)
    for (const alias of aliases) {
      const normalizedAlias = alias.trim().toLowerCase();
      if (normalizedName === normalizedAlias) {
        if (!matched.has(i)) {
          matched.add(i);
          results.push(buildResult(entry, alias, "exact"));
        }
        break;
      }
    }
  }

  // Second pass: partial/substring matches (only for unmatched standings)
  for (let i = 0; i < standings.length; i++) {
    if (matched.has(i)) continue;

    const entry = standings[i];
    const normalizedName = entry.playerName.trim().toLowerCase();

    for (const alias of aliases) {
      const normalizedAlias = alias.trim().toLowerCase();

      if (normalizedAlias.length < MIN_SUBSTRING_LENGTH && normalizedName.length < MIN_SUBSTRING_LENGTH) {
        continue;
      }

      const isSubstring =
        (normalizedAlias.length >= MIN_SUBSTRING_LENGTH && normalizedName.includes(normalizedAlias)) ||
        (normalizedName.length >= MIN_SUBSTRING_LENGTH && normalizedAlias.includes(normalizedName));

      if (isSubstring) {
        if (!matched.has(i)) {
          matched.add(i);
          results.push(buildResult(entry, alias, "partial"));
        }
        break;
      }
    }
  }

  return results;
}

function buildResult(
  entry: NormalizedStanding,
  matchedAlias: string,
  confidence: MatchConfidence
): PotentialUserResult {
  return {
    playerName: entry.playerName,
    matchedAlias,
    confidence,
    standing: entry.standing,
    wins: entry.wins,
    losses: entry.losses,
    draws: entry.draws,
    points: entry.points,
  };
}
