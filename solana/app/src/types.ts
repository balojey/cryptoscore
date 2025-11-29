export interface MarketDashboardInfo {
  marketAddress: string // Solana public key as base58 string
  matchId: bigint
  creator: string // Solana public key as base58 string
  entryFee: bigint
  resolved: boolean
  winner: number
  participantsCount: bigint
  isPublic: boolean
  startTime: bigint
  homeCount: bigint
  awayCount: bigint
  drawCount: bigint
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
  marketAddress: string // Solana public key as base58 string
  matchId: bigint
  entryFee: bigint // Amount in lamports (1 SOL = 1,000,000,000 lamports)
  creator: string // Solana public key as base58 string
  participantsCount: bigint
  resolved: boolean
  isPublic: boolean
  startTime: bigint
  homeCount?: bigint
  awayCount?: bigint
  drawCount?: bigint
}

export interface MarketCardProps {
  market: Market
  variant?: 'default' | 'compact'
}

export interface MarketProps {
  match: Match
  userHasMarket: boolean
  marketAddress?: string // Solana PublicKey as base58 string
  refetchMarkets: () => void
}
