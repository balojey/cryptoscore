import { useEffect, useMemo, useState } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI } from '../config/contracts'
import { Market } from './Market'

// --- TYPES ---
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

const COMPETITIONS = [
  { code: 'PL', name: 'Premier League' },
  { code: 'CL', name: 'Champions League' },
  { code: 'EL', name: 'Europa League' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'PD', name: 'La Liga' },
  { code: 'FL1', name: 'Ligue 1' },
]

// --- COMPONENT ---
export function Markets() {
  const [matches, setMatches] = useState<Match[]>([])
  const [competition, setCompetition] = useState('PL')
  const [dateFilter, setDateFilter] = useState('today')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { address: userAddress } = useAccount()

  // Fetch all markets created by the factory
  const { data: allMarkets, refetch: refetchAllMarkets } = useContractRead({
    address: CRYPTO_SCORE_FACTORY_ADDRESS,
    abi: CryptoScoreFactoryABI,
    functionName: 'getAllMarkets',
  })

  // Create a set of match IDs for markets created by the current user
  const userMarketMatchIds = useMemo(() => {
    if (!allMarkets || !userAddress)
      return new Set<number>()

    return new Set(
      (allMarkets as any[])
        .filter(market => market.creator === userAddress)
        .map(market => Number(market.matchId)),
    )
  }, [allMarkets, userAddress])

  useEffect(() => {
    setLoading(true)
    setError(null)

    const today = new Date()
    const in1 = new Date(today)
    in1.setDate(today.getDate() + 1)
    const in5 = new Date(today)
    in5.setDate(today.getDate() + 5)

    const toISO = (d: Date) => d.toISOString()

    const dummyMatches: Match[] = [
      {
        id: 1,
        utcDate: toISO(today),
        status: 'SCHEDULED',
        matchday: 1,
        stage: 'REGULAR_SEASON',
        group: null,
        lastUpdated: toISO(today),
        area: { id: 1, name: 'England', code: 'ENG', flag: '' },
        competition: { id: 100, name: 'Premier League', code: 'PL', type: 'LEAGUE', emblem: '' },
        season: { id: 1, startDate: toISO(today), endDate: toISO(in5), currentMatchday: 1, winner: null },
        homeTeam: { id: 11, name: 'Team A', shortName: 'A', tla: 'TMA', crest: '' },
        awayTeam: { id: 12, name: 'Team B', shortName: 'B', tla: 'TMB', crest: '' },
        score: {
          winner: null,
          duration: 'REGULAR',
          fullTime: { home: null, away: null },
          halfTime: { home: null, away: null },
        },
        odds: { msg: '' },
        referees: [],
      },
      {
        id: 2,
        utcDate: toISO(in1),
        status: 'SCHEDULED',
        matchday: 1,
        stage: 'KNOCKOUT_STAGE',
        group: null,
        lastUpdated: toISO(in1),
        area: { id: 2, name: 'Europe', code: 'EUR', flag: '' },
        competition: { id: 200, name: 'Champions League', code: 'CL', type: 'CUP', emblem: '' },
        season: { id: 2, startDate: toISO(today), endDate: toISO(in5), currentMatchday: 1, winner: null },
        homeTeam: { id: 21, name: 'Team C', shortName: 'C', tla: 'TMC', crest: '' },
        awayTeam: { id: 22, name: 'Team D', shortName: 'D', tla: 'TMD', crest: '' },
        score: {
          winner: null,
          duration: 'REGULAR',
          fullTime: { home: null, away: null },
          halfTime: { home: null, away: null },
        },
        odds: { msg: '' },
        referees: [],
      },
      {
        id: 3,
        utcDate: toISO(in5),
        status: 'SCHEDULED',
        matchday: 5,
        stage: 'REGULAR_SEASON',
        group: null,
        lastUpdated: toISO(in5),
        area: { id: 1, name: 'England', code: 'ENG', flag: '' },
        competition: { id: 100, name: 'Premier League', code: 'PL', type: 'LEAGUE', emblem: '' },
        season: { id: 1, startDate: toISO(today), endDate: toISO(in5), currentMatchday: 5, winner: null },
        homeTeam: { id: 13, name: 'Team E', shortName: 'E', tla: 'TME', crest: '' },
        awayTeam: { id: 14, name: 'Team F', shortName: 'F', tla: 'TMF', crest: '' },
        score: {
          winner: null,
          duration: 'REGULAR',
          fullTime: { home: null, away: null },
          halfTime: { home: null, away: null },
        },
        odds: { msg: '' },
        referees: [],
      },
    ]

    const start = new Date(today)
    const end = new Date(today)
    if (dateFilter === 'today') {
      end.setDate(start.getDate() + 1)
    }
    else if (dateFilter === 'next7days') {
      end.setDate(start.getDate() + 7)
    }
    else {
      // default to next 7 days
      end.setDate(start.getDate() + 7)
    }

    const filtered = dummyMatches.filter((m) => {
      // filter by competition code
      if (m.competition.code !== competition)
        return false
      const dt = new Date(m.utcDate)
      return dt >= start && dt <= end
    })

    // simulate async behaviour briefly
    setTimeout(() => {
      setMatches(filtered)
      setLoading(false)
    }, 200)
  }, [competition, dateFilter])

  return (
    <div>
      <div className="competition-filter">
        {COMPETITIONS.map(comp => (
          <button
            key={comp.code}
            className={competition === comp.code ? 'active' : ''}
            onClick={() => setCompetition(comp.code)}
          >
            {comp.name}
          </button>
        ))}
      </div>

      <div className="date-filter">
        <button
          className={dateFilter === 'today' ? 'active' : ''}
          onClick={() => setDateFilter('today')}
        >
          Today
        </button>
        <button
          className={dateFilter === 'next7days' ? 'active' : ''}
          onClick={() => setDateFilter('next7days')}
        >
          Next 7 days
        </button>
      </div>

      {loading && <p>Loading matches...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p>No future matches for this competition. Please select another one.</p>
      )}

      <div>
        {matches.map(match => (
          <Market
            key={match.id}
            match={match}
            userHasMarket={userMarketMatchIds.has(match.id)}
            refetchMarkets={refetchAllMarkets}
          />
        ))}
      </div>
    </div>
  )
}
