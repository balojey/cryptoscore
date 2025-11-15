import { useEffect, useMemo, useState } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI } from '../config/contracts'
import { Market } from './Market'
import type { Match } from '../types'

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

const FilterButton = ({ text, isActive, onClick }: { text: string, isActive: boolean, onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-[12px] font-sans text-sm font-semibold transition-colors
      ${isActive
        ? 'bg-[#0A84FF] text-white shadow'
        : 'bg-transparent text-slate-600 hover:bg-slate-200'
      }`}
  >
    {text}
  </button>
)

const MarketSkeleton = () => (
  <div className="bg-white rounded-[16px] shadow-md p-5 border border-slate-100 animate-pulse">
    <div className="flex items-start justify-between gap-2">
      <div className="flex flex-col items-center gap-2 w-2/5">
        <div className="w-12 h-12 bg-slate-200 rounded-full" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </div>
      <div className="flex flex-col items-center pt-4">
        <div className="h-3 w-8 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded mt-2" />
      </div>
      <div className="flex flex-col items-center gap-2 w-2/5">
        <div className="w-12 h-12 bg-slate-200 rounded-full" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </div>
    </div>
    <hr className="my-4 border-slate-100" />
    <div className="min-h-[140px] flex flex-col justify-center items-center">
      <div className="h-10 w-36 bg-slate-200 rounded-[12px]" />
    </div>
  </div>
)

export function Markets() {
  const [matches, setMatches] = useState<Match[]>([])
  const [competition, setCompetition] = useState('PL')
  const [dateFilter, setDateFilter] = useState('today')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { address: userAddress } = useAccount()

  const { data: allMarkets, refetch: refetchAllMarkets } = useContractRead({
    address: CRYPTO_SCORE_FACTORY_ADDRESS,
    abi: CryptoScoreFactoryABI,
    functionName: 'getAllMarkets',
  })

  const userMarketsByMatchId = useMemo(() => {
    if (!allMarkets || !userAddress)
      return new Map<number, { creator: string, marketAddress: `0x${string}` }>()

    const marketMap = new Map()
    ;(allMarkets as any[]).forEach((market) => {
      if (market.creator === userAddress) {
        marketMap.set(Number(market.matchId), {
          creator: market.creator,
          marketAddress: market.marketContractAddress,
        })
      }
    })
    return marketMap
  }, [allMarkets, userAddress])

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
        const response = await fetch(
          `https://corsproxy.io/?https://api.football-data.org/v4/competitions/${competition}/matches?status=SCHEDULED&dateFrom=${dateFrom}&dateTo=${dateTo}`,
          {
            headers: { 'X-Auth-Token': import.meta.env.VITE_FOOTBALL_DATA_API_KEY },
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center p-1 bg-slate-100 rounded-[14px] self-start">
          {COMPETITIONS.map(comp => (
            <FilterButton
              key={comp.code}
              text={comp.name}
              isActive={competition === comp.code}
              onClick={() => setCompetition(comp.code)}
            />
          ))}
        </div>
        <div className="flex items-center p-1 bg-slate-100 rounded-[14px] self-start">
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

      {/* Content */}
      <div>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <MarketSkeleton key={i} />)}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[16px] text-center" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-16">
            <span className="icon-[mdi--calendar-remove-outline] w-16 h-16 text-slate-300 mx-auto" />
            <p className="mt-4 font-sans text-lg text-slate-600">No scheduled matches found.</p>
            <p className="font-sans text-sm text-slate-400">Please adjust the filters or check back later.</p>
          </div>
        )}
        {!loading && !error && matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match) => {
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
