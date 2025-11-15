export interface MarketDashboardInfo {
  marketAddress: `0x${string}`
  matchId: bigint
  creator: `0x${string}`
  entryFee: bigint
  resolved: boolean
  winner: number
  participantsCount: bigint
  isPublic: boolean
  startTime: bigint
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

export interface Match {
  id: number;
  competition: Competition;
  utcDate: string;
  matchday: number;
  homeTeam: Team;
  awayTeam: Team;
}