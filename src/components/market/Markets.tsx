import type { Match } from '../../types'
import { useEffect, useMemo, useState } from 'react'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import { useAllMarkets } from '../../hooks/useSupabaseMarketData'
import { getRandomApiKey } from '../../utils/apiKey'
import SearchBar from '../SearchBar'
import { Market } from './Market'

const COMPETITIONS = [
  { code: 'PL', name: 'Premier League' },
  { code: 'CL', name: 'Champions League' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'PD', name: 'La Liga' },
]

const DATE_FILTERS = [
  { id: 'today', name: 'Today' },
  { id: 'next7days', name: 'Next 7 Days' },
]

function FilterButton({ text, isActive, onClick }: { text: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-lg font-sans text-sm font-semibold transition-all"
      style={{
        background: isActive ? 'var(--accent-cyan)' : 'transparent',
        color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
        border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'transparent'}`,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {text}
    </button>
  )
}

function MarketSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col items-center gap-2 w-2/5">
          <div className="w-12 h-12 skeleton rounded-full" />
          <div className="h-4 w-20 skeleton rounded" />
        </div>
        <div className="flex flex-col items-center pt-4">
          <div className="h-3 w-8 skeleton rounded" />
          <div className="h-3 w-16 skeleton rounded mt-2" />
        </div>
        <div className="flex flex-col items-center gap-2 w-2/5">
          <div className="w-12 h-12 skeleton rounded-full" />
          <div className="h-4 w-20 skeleton rounded" />
        </div>
      </div>
      <hr className="my-4" style={{ borderColor: 'var(--border-default)' }} />
      <div className="min-h-[140px] flex flex-col justify-center items-center">
        <div className="h-10 w-36 skeleton rounded-lg" />
      </div>
    </div>
  )
}

export function Markets() {
  const [matches, setMatches] = useState<Match[]>([])
  const [competition, setCompetition] = useState('PL')
  const [dateFilter, setDateFilter] = useState('today')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { publicKey: userAddress } = useUnifiedWallet()

  // Fetch all markets from Supabase
  const { data: allMarketsData, refetch: refetchAllMarkets } = useAllMarkets()

  const userMarketsByMatchId = useMemo(() => {
    if (!allMarketsData || !userAddress)
      return new Map<number, { creator: string, marketAddress: string }>()

    const marketMap = new Map()
    allMarketsData.forEach((market) => {
      if (market.creator === userAddress.toString()) {
        // Try to extract match ID from market.matchId (which might be the market ID)
        // For now, we'll use a simple approach - check if the market was created recently
        // In a real implementation, we'd store the actual match ID in the database
        const matchId = parseInt(market.matchId) || 0
        if (matchId > 0) {
          marketMap.set(matchId, {
            creator: market.creator,
            marketAddress: market.marketAddress,
          })
        }
      }
    })
    return marketMap
  }, [allMarketsData, userAddress])

  // Filter matches based on search query and exclude past matches
  const filteredMatches = useMemo(() => {
    const now = new Date()
    
    // First filter out matches that have already started
    const upcomingMatches = matches.filter((match) => {
      const matchDate = new Date(match.utcDate)
      return matchDate > now
    })

    // Then apply search filter if query exists
    if (!searchQuery.trim()) {
      return upcomingMatches
    }

    const query = searchQuery.toLowerCase()
    return upcomingMatches.filter((match) => {
      const homeTeam = match.homeTeam?.name?.toLowerCase() || ''
      const awayTeam = match.awayTeam?.name?.toLowerCase() || ''
      const competition = match.competition?.name?.toLowerCase() || ''

      return homeTeam.includes(query) || awayTeam.includes(query) || competition.includes(query)
    })
  }, [matches, searchQuery])

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true)
      setError(null)

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const formatDate = (date: Date) => date.toISOString().split('T')[0]

      let dateFrom = ''
      let dateTo = ''

      if (dateFilter === 'today') {
        dateFrom = formatDate(today)
        dateTo = formatDate(tomorrow)
      }
      else if (dateFilter === 'next7days') {
        dateFrom = formatDate(today)
        dateTo = formatDate(nextWeek)
      }

      try {
        const apiKey = getRandomApiKey()
        const response = await fetch(
          `https://corsproxy.io/?https://api.football-data.org/v4/competitions/${competition}/matches?status=SCHEDULED&dateFrom=${dateFrom}&dateTo=${dateTo}`,
          {
            headers: { 'X-Auth-Token': apiKey },
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch matches')
        }
        const data = await response.json()
        setMatches(data.matches || [])
      }
      catch (err: any) {
        console.error(err)
        setError(err.message || 'Could not fetch matches. Please try again later.')
      }
      finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [competition, dateFilter])

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="max-w-2xl">
        <SearchBar
          placeholder="Search markets by team, competition..."
          onSearch={setSearchQuery}
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
            Competition
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPETITIONS.map(comp => (
              <FilterButton
                key={comp.code}
                text={comp.name}
                isActive={competition === comp.code}
                onClick={() => setCompetition(comp.code)}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
            Time Range
          </label>
          <div className="flex flex-wrap gap-2">
            {DATE_FILTERS.map(filter => (
              <FilterButton
                key={filter.id}
                text={filter.name}
                isActive={dateFilter === filter.id}
                onClick={() => setDateFilter(filter.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array.from({ length: 6 })].map((_, i) => <MarketSkeleton key={i} />)}
          </div>
        )}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-center"
            style={{
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--error)',
            }}
            role="alert"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="icon-[mdi--alert-circle-outline] w-5 h-5" />
              <strong className="font-bold">Error</strong>
            </div>
            <span className="block text-sm">{error}</span>
          </div>
        )}
        {!loading && !error && filteredMatches.length === 0 && (
          <div className="text-center py-16">
            <span className="icon-[mdi--calendar-remove-outline] w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p className="mt-4 font-sans text-lg" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'No matches found for your search.' : 'No scheduled matches found.'}
            </p>
            <p className="font-sans text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {searchQuery ? 'Try a different search term.' : 'Please adjust the filters or check back later.'}
            </p>
          </div>
        )}
        {!loading && !error && filteredMatches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMatches.map((match) => {
              const userMarketInfo = userMarketsByMatchId.get(match.id)
              return (
                <Market
                  key={match.id}
                  match={match}
                  userHasMarket={!!userMarketInfo}
                  marketAddress={userMarketInfo?.marketAddress}
                  refetchMarkets={refetchAllMarkets}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
