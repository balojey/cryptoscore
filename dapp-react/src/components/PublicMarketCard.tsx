import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { shortenAddress } from '../utils/formatters'
import { useMatchData } from '../hooks/useMatchData'

interface PublicMarketCardProps {
  marketAddress: `0x${string}`
  matchId: bigint
  entryFee: bigint
  creator: `0x${string}`
  participantsCount: bigint
  resolved: boolean
  startTime: bigint
  isPublic: boolean
}

export default function PublicMarketCard(props: PublicMarketCardProps) {
  const { marketAddress, matchId, entryFee, creator, participantsCount } = props
  const { data: matchData, loading, error } = useMatchData(Number(matchId))

  return (
    <div className="card bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 border rounded-lg">
      <div className="card-body p-4">
        {loading && <div className="h-24 flex items-center justify-center"><span className="loading loading-spinner text-primary"></span><p className='ml-2'>Loading match...</p></div>}
        {error && <div className="h-24 flex items-center justify-center text-red-500">Match details unavailable.</div>}
        {matchData && (
          <div className="mb-4">
            <div className="text-center text-sm text-gray-500 mb-2">
              {matchData.competition.name} - Round {matchData.matchday}
            </div>
            <div className="grid grid-cols-3 items-center text-center">
              <div className="flex flex-col items-center">
                <img src={matchData.homeTeam.crest} alt={matchData.homeTeam.name} className="w-12 h-12 mx-auto" />
                <span className="font-bold mt-1">{matchData.homeTeam.name}</span>
              </div>
              <div className="font-bold text-2xl">VS</div>
              <div className="flex flex-col items-center">
                <img src={matchData.awayTeam.crest} alt={matchData.awayTeam.name} className="w-12 h-12 mx-auto" />
                <span className="font-bold mt-1">{matchData.awayTeam.name}</span>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
              {new Date(matchData.utcDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
            </div>
          </div>
        )}

        <div className="border-t-2 border-gray-100 pt-4 space-y-2">
          <p className="text-sm">
            <span className="font-semibold">Creator:</span>
            <span className="font-mono ml-2 bg-gray-100 p-1 rounded">{shortenAddress(creator)}</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">Entry:</span>
            <span className="font-bold ml-2">{formatEther(entryFee)} PAS</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">Participants:</span>
            <span className="font-bold ml-2">{participantsCount.toString()}</span>
          </p>
        </div>

        <div className="card-actions justify-end mt-4">
          <Link to={`/market/${marketAddress}`} className="btn btn-primary btn-block">
            View & Join Market
          </Link>
        </div>
      </div>
    </div>
  )
}
