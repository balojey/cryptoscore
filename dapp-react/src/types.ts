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

export interface Match {
  id: number
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  lastUpdated: string
  area: {
    id: number
    name: string
    code: string
    flag: string
  }
  competition: {
    id: number
    name: string
    code: string
    type: string
    emblem: string
  }
  season: {
    id: number
    startDate: string
    endDate: string
    currentMatchday: number
    winner: string | null
  }
  homeTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  score: {
    winner: string | null
    duration: string
    fullTime: {
      home: number | null
      away: number | null
    }
    halfTime: {
      home: number | null
      away: number | null
    }
  }
  odds: {
    msg: string
  }
  referees: any[]
}

// Unified Market type for props
export interface Market {
  marketAddress: `0x${string}`
  matchId: bigint
  entryFee: bigint
  creator: `0x${string}`
  participantsCount: bigint
  resolved: boolean
  isPublic: boolean
  startTime: bigint
}

export interface MarketCardProps {
  market: Market
  variant?: 'default' | 'compact'
}

export interface MarketProps {
  match: Match
  userHasMarket: boolean
  marketAddress?: `0x${string}`
  refetchMarkets: () => void
}
