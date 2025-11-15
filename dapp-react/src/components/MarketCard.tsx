import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { shortenAddress } from '../utils/formatters'
import { useMatchData } from '../hooks/useMatchData'

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

interface MarketCardProps {
  market: Market
  variant?: 'default' | 'compact'
}

// Skeleton component for loading state
export const MarketCardSkeleton = () => (
  <div className="bg-white rounded-[16px] shadow-md p-6 border border-slate-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-1/3 h-5 bg-slate-200 rounded" />
      <div className="w-1/4 h-5 bg-slate-200 rounded" />
    </div>
    <div className="flex items-center justify-between my-6">
      <div className="flex flex-col items-center gap-2 w-2/5">
        <div className="w-16 h-16 bg-slate-200 rounded-full" />
        <div className="h-5 w-24 bg-slate-200 rounded" />
      </div>
      <div className="h-6 w-6 bg-slate-200 rounded" />
      <div className="flex flex-col items-center gap-2 w-2/5">
        <div className="w-16 h-16 bg-slate-200 rounded-full" />
        <div className="h-5 w-24 bg-slate-200 rounded" />
      </div>
    </div>
    <div className="space-y-3 border-t border-slate-100 pt-4">
      <div className="h-5 w-full bg-slate-200 rounded" />
      <div className="h-5 w-full bg-slate-200 rounded" />
      <div className="h-5 w-full bg-slate-200 rounded" />
    </div>
    <div className="mt-6 h-12 w-full bg-slate-200 rounded-[12px]" />
  </div>
)

const TeamDisplay = ({ team }: { team: { name: string, crest: string } }) => (
  <div className="flex flex-col items-center gap-3 w-2/5 text-center">
    <img src={team.crest} alt={team.name} className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64' }} />
    <h3 className="font-jakarta font-bold text-lg text-[#1E293B] leading-tight" title={team.name}>{team.name}</h3>
  </div>
)

const InfoRow = ({ label, value, icon }: { label: string, value: React.ReactNode, icon: string }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-slate-500">
      <span className={`icon-[${icon}] w-4 h-4`} />
      <span>{label}</span>
    </div>
    <span className="font-semibold text-[#1E293B]">{value}</span>
  </div>
)

const MarketCardContent = ({ market }: { market: Market }) => {
  const { data: matchData, loading, error } = useMatchData(Number(market.matchId))

  if (loading) {
    return <MarketCardSkeleton />
  }

  if (error || !matchData) {
    return (
      <div className="bg-white rounded-[16px] shadow-md p-6 border border-red-200 flex flex-col items-center justify-center text-center min-h-[400px]">
        <span className="icon-[mdi--alert-circle-outline] w-12 h-12 text-red-400 mb-4" />
        <h3 className="font-bold text-lg text-slate-800">Match Data Unavailable</h3>
        <p className="text-sm text-slate-500">Could not load details for Match ID: {market.matchId.toString()}</p>
      </div>
    )
  }

  return (
    <div className="p-6 flex-grow flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="text-left">
          <p className="font-sans text-sm font-medium text-slate-500">{matchData.competition.name}</p>
          <p className="font-sans text-xs text-slate-400">{new Date(matchData.utcDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {market.resolved && <div className="badge badge-success text-xs font-bold text-white">Resolved</div>}
          <div className={`badge ${market.isPublic ? 'badge-info' : 'badge-secondary'} text-xs font-bold text-white`}>{market.isPublic ? 'Public' : 'Private'}</div>
        </div>
      </div>

      {/* Matchup */}
      <div className="flex items-start justify-between my-6">
        <TeamDisplay team={matchData.homeTeam} />
        <div className="font-jakarta text-2xl font-bold text-slate-300 pt-6">VS</div>
        <TeamDisplay team={matchData.awayTeam} />
      </div>

      <div className="flex-grow" />

      {/* Market Info */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <InfoRow
          label="Entry Fee"
          value={<>{formatEther(market.entryFee)} <span className="font-normal text-slate-400">PAS</span></>}
          icon="mdi--login"
        />
        <InfoRow
          label="Participants"
          value={market.participantsCount.toString()}
          icon="mdi--account-group-outline"
        />
        <InfoRow
          label="Creator"
          value={<span className="font-mono">{shortenAddress(market.creator)}</span>}
          icon="mdi--account-edit-outline"
        />
      </div>
    </div>
  )
}

export default function MarketCard({ market, variant = 'default' }: MarketCardProps) {
  const { address: userAddress } = useAccount()

  if (variant === 'compact') {
    return (
      <Link to={`/market/${market.marketAddress}`} className="bg-white rounded-[16px] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-slate-100/50">
        <MarketCardContent market={market} />
      </Link>
    )
  }

  // Default variant
  const isOwner = userAddress?.toLowerCase() === market.creator.toLowerCase()
  const buttonText = isOwner ? 'View Your Market' : 'View & Join Market'
  const buttonStyle = 'w-full flex items-center justify-center gap-2 h-12 px-6 bg-[#0A84FF] text-white rounded-[12px] font-sans text-base font-bold uppercase tracking-wider transition-all hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'

  return (
    <div className="bg-white rounded-[16px] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-slate-100/50">
      <MarketCardContent market={market} />
      <div className="px-6 pb-6">
        <Link to={`/market/${market.marketAddress}`} className={buttonStyle}>
          {buttonText}
        </Link>
      </div>
    </div>
  )
}
