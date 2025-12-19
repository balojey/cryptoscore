import type { MarketDashboardInfo } from '../../types'
import { PublicKey } from '@solana/web3.js'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { MARKET_PROGRAM_ID } from '../../config/programs'
import { useCurrency } from '../../hooks/useCurrency'
import { useSolanaConnection } from '../../hooks/useSolanaConnection'
import { AccountDecoder } from '../../lib/solana/account-decoder'
import { PDAUtils } from '../../lib/solana/pda-utils'

interface PortfolioSummaryProps {
  userAddress?: string
  joinedMarkets?: MarketDashboardInfo[]
  allMarkets?: MarketDashboardInfo[] // Include all markets (created + joined) for comprehensive stats
}

export default function PortfolioSummary({ userAddress, joinedMarkets = [], allMarkets }: PortfolioSummaryProps) {
  const { publicKey } = useUnifiedWallet()
  const { connection } = useSolanaConnection()
  const { formatCurrency, currency } = useCurrency()
  const walletAddress = userAddress || publicKey?.toString()

  // Use allMarkets if provided, otherwise fall back to joinedMarkets
  // This allows showing stats for both created and joined markets
  const marketsToAnalyze = allMarkets && allMarkets.length > 0 ? allMarkets : joinedMarkets

  // Debug logging
  console.log('[PortfolioSummary] Wallet:', walletAddress)
  console.log('[PortfolioSummary] Joined Markets Count:', joinedMarkets.length)
  console.log('[PortfolioSummary] All Markets Count:', allMarkets?.length || 0)
  console.log('[PortfolioSummary] Markets to Analyze:', marketsToAnalyze.length)
  console.log('[PortfolioSummary] Markets:', marketsToAnalyze)

  // Fetch participant data for all markets
  const { data: portfolioData, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['portfolioData', walletAddress, marketsToAnalyze.map(m => m.marketAddress).join(',')],
    queryFn: async () => {
      if (!walletAddress || marketsToAnalyze.length === 0) {
        return {
          userMarketData: [],
        }
      }

      const userPubkey = new PublicKey(walletAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)
      const pdaUtils = new PDAUtils(marketProgramId)

      // Fetch participant data for each market
      const userMarketData = await Promise.all(
        marketsToAnalyze.map(async (market) => {
          try {
            const marketPubkey = new PublicKey(market.marketAddress)
            const { pda: participantPda } = await pdaUtils.findParticipantPDA(marketPubkey, userPubkey)

            // Fetch participant account
            const accountInfo = await connection.getAccountInfo(participantPda)

            if (!accountInfo || !accountInfo.data) {
              // User hasn't joined this market
              return null
            }

            // Decode participant data
            const participant = AccountDecoder.decodeParticipant(accountInfo.data)

            // Calculate reward if market is resolved
            let reward = 0
            if (market.resolved && market.outcome) {
              // Convert outcome to prediction number (Home=0, Draw=1, Away=2)
              const outcomeMap: Record<string, number> = { Home: 0, Draw: 1, Away: 2 }
              const winningPrediction = outcomeMap[market.outcome]

              console.log(`[PortfolioSummary] Market ${market.marketAddress}: prediction=${participant.prediction}, winning=${winningPrediction}, outcome=${market.outcome}`)

              // Check if user's prediction matches the winner
              if (participant.prediction === winningPrediction) {
                // Calculate winner count based on outcome
                const winnerCount = market.outcome === 'Home'
                  ? Number(market.homeCount)
                  : market.outcome === 'Away'
                    ? Number(market.awayCount)
                    : Number(market.drawCount)

                const totalPool = market.totalPool ? Number(market.totalPool) : 0

                console.log(`[PortfolioSummary] Winner! totalPool=${totalPool}, winnerCount=${winnerCount}`)

                // Calculate reward: totalPool / winnerCount
                if (winnerCount > 0 && totalPool > 0) {
                  reward = totalPool / winnerCount
                  console.log(`[PortfolioSummary] Calculated reward: ${reward} lamports`)
                }
              }
            }

            return {
              market,
              prediction: participant.prediction,
              reward,
              hasWithdrawn: participant.hasWithdrawn,
              entryFee: Number(market.entryFee),
            }
          }
          catch (error) {
            console.error(`Error fetching participant data for market ${market.marketAddress}:`, error)
            return null
          }
        }),
      )

      // Filter out null entries (markets user hasn't joined)
      return {
        userMarketData: userMarketData.filter(data => data !== null) as Array<{
          market: MarketDashboardInfo
          prediction: number
          reward: number
          hasWithdrawn: boolean
          entryFee: number
        }>,
      }
    },
    enabled: !!walletAddress && marketsToAnalyze.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  })

  const stats = useMemo(() => {
    console.log('[PortfolioSummary] Computing stats...')
    console.log('[PortfolioSummary] Portfolio Data:', portfolioData)

    if (!walletAddress) {
      console.log('[PortfolioSummary] No wallet address')
      return {
        totalValue: 0,
        activePositions: 0,
        resolvedPositions: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalPnL: 0,
      }
    }

    const userMarketData = portfolioData?.userMarketData || []

    console.log('[PortfolioSummary] User market data count:', userMarketData.length)

    // Active positions = markets user participated in that are still open (not resolved)
    const activePositions = userMarketData.filter(data => !data.market.resolved).length
    const resolvedPositions = userMarketData.filter(data => data.market.resolved).length

    console.log('[PortfolioSummary] Active positions:', activePositions)
    console.log('[PortfolioSummary] Resolved positions:', resolvedPositions)

    // Calculate total invested (entry fees for all participated markets) - in lamports
    const totalInvestedLamports = userMarketData.reduce((sum, data) => {
      return sum + data.entryFee
    }, 0)

    // Calculate wins and losses based on actual predictions
    let totalWins = 0
    let totalLosses = 0
    let totalClaimableRewardsLamports = 0
    let totalWithdrawnRewardsLamports = 0

    userMarketData.forEach((data) => {
      const { market, prediction, reward, hasWithdrawn } = data

      // If market is resolved and has an outcome
      if (market.resolved && market.outcome) {
        // Convert outcome to prediction number (Home=0, Draw=1, Away=2)
        const outcomeMap: Record<string, number> = { Home: 0, Draw: 1, Away: 2 }
        const winningPrediction = outcomeMap[market.outcome]

        // Check if user's prediction matches the winner
        if (prediction === winningPrediction) {
          totalWins++

          // Track rewards
          if (hasWithdrawn) {
            totalWithdrawnRewardsLamports += reward
          }
          else {
            totalClaimableRewardsLamports += reward
          }
        }
        else {
          totalLosses++
          // Lost markets: user loses their entry fee (no reward)
        }
      }
    })

    const winRate = resolvedPositions > 0 ? (totalWins / resolvedPositions) * 100 : 0

    // P&L = (Total rewards received/claimable) - Total invested
    // Rewards already include the entry fee, so this gives true profit/loss
    const totalRewardsLamports = totalWithdrawnRewardsLamports + totalClaimableRewardsLamports
    const totalPnLLamports = totalRewardsLamports - totalInvestedLamports

    // Portfolio Value = Invested in active positions + Claimable rewards from resolved wins
    // For active positions, we count the entry fee (what's at stake)
    // For resolved wins, we count claimable rewards (what we can withdraw)
    const activePositionsValueLamports = userMarketData
      .filter(data => !data.market.resolved)
      .reduce((sum, data) => sum + data.entryFee, 0)

    const totalValueLamports = activePositionsValueLamports + totalClaimableRewardsLamports

    // Convert to SOL for display
    const totalValue = totalValueLamports / 1_000_000_000
    const totalPnL = totalPnLLamports / 1_000_000_000

    console.log('[PortfolioSummary] Final Stats:', {
      totalValue,
      activePositions,
      resolvedPositions,
      totalWins,
      totalLosses,
      winRate,
      totalPnL,
      totalInvestedLamports,
      totalClaimableRewardsLamports,
      totalWithdrawnRewardsLamports,
      activePositionsValueLamports,
    })

    return {
      totalValue,
      activePositions,
      resolvedPositions,
      totalWins,
      totalLosses,
      winRate,
      totalPnL,
    }
  }, [walletAddress, portfolioData])

  const StatCard = ({
    label,
    value,
    icon,
    color,
    subtitle,
    trend,
  }: {
    label: string
    value: string | number
    icon: string
    color: string
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
  }) => (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <span className="stat-label">{label}</span>
          <span className={`icon-[${icon}] w-6 h-6`} style={{ color }} />
        </div>
        <div className="stat-value mb-1">{value}</div>
        {subtitle && (
          <div className="flex items-center gap-2">
            {trend && (
              <span
                className={`icon-[mdi--${trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'}] w-4 h-4`}
                style={{
                  color: trend === 'up'
                    ? 'var(--accent-green)'
                    : trend === 'down'
                      ? 'var(--accent-red)'
                      : 'var(--text-tertiary)',
                }}
              />
            )}
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {subtitle}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Format portfolio value with SOL equivalent
  const portfolioValueLamports = stats.totalValue * 1_000_000_000
  const portfolioValueFormatted = formatCurrency(portfolioValueLamports, { showSymbol: true })
  const portfolioValueSubtitle = currency !== 'SOL'
    ? formatCurrency(portfolioValueLamports, { targetCurrency: 'SOL', showSymbol: true })
    : 'Invested + profits'

  // Format P&L with SOL equivalent
  const pnlLamports = Math.abs(stats.totalPnL) * 1_000_000_000
  const pnlSign = stats.totalPnL >= 0 ? '+' : '-'
  const pnlFormatted = `${pnlSign}${formatCurrency(pnlLamports, { showSymbol: true })}`
  const pnlSubtitle = currency !== 'SOL'
    ? formatCurrency(pnlLamports, { targetCurrency: 'SOL', showSymbol: true })
    : stats.totalPnL >= 0 ? 'Profit' : 'Loss'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Portfolio Value"
        value={portfolioValueFormatted}
        icon="mdi--wallet-outline"
        color="var(--accent-cyan)"
        subtitle={portfolioValueSubtitle}
      />

      <StatCard
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        icon="mdi--trophy-outline"
        color="var(--accent-green)"
        subtitle={`${stats.totalWins}W / ${stats.totalLosses}L`}
        trend={stats.winRate >= 50 ? 'up' : stats.winRate > 0 ? 'down' : 'neutral'}
      />

      <StatCard
        label="Active Positions"
        value={stats.activePositions}
        icon="mdi--lightning-bolt"
        color="var(--accent-amber)"
        subtitle="Open markets"
      />

      <StatCard
        label="P&L"
        value={pnlFormatted}
        icon="mdi--chart-line"
        color={stats.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
        subtitle={pnlSubtitle}
        trend={stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : 'neutral'}
      />
    </div>
  )
}
