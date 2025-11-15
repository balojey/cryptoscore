import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
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

// Skeleton component for loading state
export const PublicMarketCardSkeleton = () => (
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

export default function PublicMarketCard(props: PublicMarketCardProps) {
  const { marketAddress, matchId, entryFee, creator, participantsCount } = props
  const { address: userAddress } = useAccount()
  const { data: matchData, loading, error } = useMatchData(Number(matchId))

  // Per DLS: Determine button state
  // This is a simplified version. A real implementation would need more state.
  // e.g., is user a participant? Is match started?
  const isOwner = userAddress?.toLowerCase() === creator.toLowerCase()
  const buttonText = isOwner ? 'View Your Market' : 'View & Join Market'
  const buttonStyle
    = 'w-full flex items-center justify-center gap-2 h-12 px-6 bg-[#0A84FF] text-white rounded-[12px] font-sans text-base font-bold uppercase tracking-wider transition-all hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'

  if (loading) {
    return <PublicMarketCardSkeleton />
  }

  if (error || !matchData) {
    return (
      <div className="bg-white rounded-[16px] shadow-md p-6 border border-red-200 flex flex-col items-center justify-center text-center min-h-[400px]">
        <span className="icon-[mdi--alert-circle-outline] w-12 h-12 text-red-400 mb-4" />
        <h3 className="font-bold text-lg text-slate-800">Match Data Unavailable</h3>
        <p className="text-sm text-slate-500">Could not load details for Match ID: {matchId.toString()}</p>
      </div>
    )
  }

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

  return (
    <div className="bg-white rounded-[16px] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-slate-100/50">
      <div className="p-6 flex-grow flex flex-col">
        {/* Header */}
        <div className="text-center">
          <p className="font-sans text-sm font-medium text-slate-500">{matchData.competition.name}</p>
          <p className="font-sans text-xs text-slate-400">{new Date(matchData.utcDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>

        {/* Matchup */}
        <div className="flex items-start justify-between my-6">
          <TeamDisplay team={matchData.homeTeam} />
          <div className="font-jakarta text-2xl font-bold text-slate-300 pt-6">VS</div>
          <TeamDisplay team={matchData.awayTeam} />
        </div>

        {/* Spacer to push content below */}
        <div className="flex-grow" />

        {/* Market Info */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <InfoRow
            label="Entry Fee"
            value={<>{formatEther(entryFee)} <span className="font-normal text-slate-400">PAS</span></>}
            icon="mdi--login"
          />
          <InfoRow
            label="Participants"
            value={participantsCount.toString()}
            icon="mdi--account-group-outline"
          />
          <InfoRow
            label="Creator"
            value={<span className="font-mono">{shortenAddress(creator)}</span>}
            icon="mdi--account-edit-outline"
          />
        </div>

        {/* Action */}
        <div className="mt-6">
          <Link to={`/market/${marketAddress}`} className={buttonStyle}>
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  )
}
