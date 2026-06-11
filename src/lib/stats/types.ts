/**
 * A confirmed tournament result for the user.
 * Only confirmed (isUserResult=true, needsConfirmation=false) records should be passed.
 */
export interface TournamentRecord {
  eventId: string;
  eventName: string;
  storeName: string | null;
  date: Date | null;
  standing: number | null;
  wins: number;
  losses: number;
  draws: number;
  deckName: string | null;
  totalPlayers: number | null;
}

/**
 * A single match the user played.
 * Only user matches (isUserMatch=true) with result !== UNKNOWN should be passed.
 */
export interface MatchRecord {
  eventId: string;
  roundNumber: number | null;
  opponentName: string | null;
  result: "WIN" | "LOSS" | "DRAW";
  date: Date | null;
}

export interface OverallStats {
  totalTournaments: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  winRateNoDraws: number;
  averageStanding: number;
  bestStanding: number | null;
}

export interface GroupedWinRate {
  name: string;
  winRate: number;
  winRateNoDraws: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  tournaments: number;
}

export interface MonthlyWinRate {
  month: string; // "YYYY-MM"
  winRate: number;
  winRateNoDraws: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface RecentForm {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  winRateNoDraws: number;
}

export interface BreakdownStats {
  byStore: GroupedWinRate[];
  byDeck: GroupedWinRate[];
  overTime: MonthlyWinRate[];
}

export interface FullStats {
  overall: OverallStats;
  breakdown: BreakdownStats;
  recentForm5: RecentForm;
  recentForm10: RecentForm;
}
