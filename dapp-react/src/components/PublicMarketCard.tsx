import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { shortenAddress } from '../utils/formatters'

interface PublicMarketCardProps {
  marketAddress: string
  matchId: bigint
  entryFee: bigint
  creator: string
  participantsCount: bigint
  resolved: boolean
  startTime: bigint
  isPublic: boolean
}

export default function PublicMarketCard({
  marketAddress,
  matchId,
  entryFee,
  creator,
  participantsCount,
  startTime,
}: PublicMarketCardProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Match #{matchId.toString()}</h2>
        <p>
          Created by:
          <span className="font-mono">{shortenAddress(creator)}</span>
        </p>
        <p>
          Entry Fee:
          {formatEther(entryFee)}
          {' '}
          PAS
        </p>
        <p>
          Participants:
          {participantsCount.toString()}
        </p>
        <p>
          Starts:
          {new Date(Number(startTime) * 1000).toLocaleString()}
        </p>
        <div className="card-actions justify-end">
          <Link to={`/market/${marketAddress}`} className="btn btn-primary">
            Join Market
          </Link>
        </div>
      </div>
    </div>
  )
}
