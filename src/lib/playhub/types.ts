import { z } from "zod";

/**
 * InkStats-normalized types for PlayHub data.
 * These are the shapes exposed to the rest of the app — never raw API objects.
 */

// --- Search params ---

export const SearchEventsParamsSchema = z.object({
  city: z.string().min(2).max(100).optional(),
  storeId: z.number().optional(),
  radiusMiles: z.number().min(5).max(200).default(25),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  statuses: z.array(z.enum(["upcoming", "inProgress", "past"])).default(["past"]),
  pageSize: z.number().min(1).max(100).default(50),
  page: z.number().min(1).default(1),
});

export type SearchEventsParams = z.infer<typeof SearchEventsParamsSchema>;

// --- Normalized event (search result) ---

export interface NormalizedEvent {
  id: number;
  name: string;
  storeName: string | null;
  city: string | null;
  startDate: string | null; // ISO string
  format: string | null;
  category: string | null;
  totalPlayers: number | null;
  status: string | null;
}

// --- Normalized standings entry ---

export interface NormalizedStanding {
  playerName: string;
  standing: number | null;
  wins: number;
  losses: number;
  draws: number;
  points: number | null;
}

// --- Normalized event details (full import) ---

export interface NormalizedEventDetails {
  id: number;
  name: string;
  storeName: string | null;
  city: string | null;
  startDate: string | null;
  format: string | null;
  category: string | null;
  totalPlayers: number | null;
  standings: NormalizedStanding[];
  rounds: NormalizedRound[];
}

// --- Normalized round match ---

export interface NormalizedMatch {
  roundNumber: number;
  playerName: string;
  opponentName: string | null;
  result: "WIN" | "LOSS" | "DRAW" | "UNKNOWN";
  score: string | null;
}

export interface NormalizedRound {
  roundNumber: number;
  roundId: number;
  matches: NormalizedMatch[];
}

// --- Player matching result ---

export type MatchConfidence = "exact" | "partial";

export interface PotentialUserResult {
  playerName: string;
  matchedAlias: string;
  confidence: MatchConfidence;
  standing: number | null;
  wins: number;
  losses: number;
  draws: number;
  points: number | null;
}

// --- Search result ---

export interface EventSearchResponse {
  events: NormalizedEvent[];
  total: number;
  currentPage: number;
  nextPage: number | null;
}
