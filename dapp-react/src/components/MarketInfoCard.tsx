import type { MarketDashboardInfo } from '../types'
import { Link } from 'react-router-dom'
import { useMatchData } from '../hooks/useMatchData'
import { formatEther } from 'viem'

export function MarketInfoCard({ market }: { market: MarketDashboardInfo }) {
  const { data: matchData, loading, error } = useMatchData(Number(market.matchId))

  return (
    <Link
      to={`/market/${market.marketAddress}`}
      className="block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
    >
      {loading && <p className="text-sm text-gray-500">Loading match data...</p>}
      {error && <p className="text-sm text-red-500">Match details unavailable</p>}
      {matchData && (
        <div className="mb-4">
          <div className="text-center text-sm text-gray-600 mb-2">
            {matchData.competition.name} - Matchday {matchData.matchday}
          </div>
          <div className="grid grid-cols-3 items-center text-center">
            <div className="flex flex-col items-center">
              <img src={matchData.homeTeam.crest} alt={matchData.homeTeam.name} className="w-10 h-10 mx-auto" />
              <span className="font-semibold mt-1">{matchData.homeTeam.name}</span>
            </div>
            <div className="font-bold text-xl">VS</div>
            <div className="flex flex-col items-center">
              <img src={matchData.awayTeam.crest} alt={matchData.awayTeam.name} className="w-10 h-10 mx-auto" />
              <span className="font-semibold mt-1">{matchData.awayTeam.name}</span>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">
            {new Date(matchData.utcDate).toLocaleString()}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Market:
            {market.marketAddress.slice(0, 6)}
            ...
            {market.marketAddress.slice(-4)}
          </h3>
          <span className={`badge ${market.isPublic ? 'badge-accent' : 'badge-secondary'}`}>
            {market.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Creator:
          {market.creator.slice(0, 6)}
          ...
          {market.creator.slice(-4)}
        </p>
        <p className="text-sm text-gray-600">
          Entry Fee:
          {formatEther(market.entryFee)}
          {' '}
          PAS
        </p>
        <p className="text-sm text-gray-600">
          Participants:
          {market.participantsCount.toString()}
        </p>
        {market.resolved && (
          <p className="mt-2 text-sm font-bold text-green-600">Resolved</p>
        )}
      </div>
    </Link>
  )
}
