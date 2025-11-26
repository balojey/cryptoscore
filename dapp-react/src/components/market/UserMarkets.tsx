import type { Market } from '../../types'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../../config/contracts'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../cards/EnhancedMarketCard'

export function UserMarkets() {
  const { address, isConnected } = useAccount()

  // Fetch all markets from factory
  const { data: factoryMarkets, isLoading: isLoadingFactory } = useReadContract({
    address: CRYPTO_SCORE_FACTORY_ADDRESS as `0x${string}`,
    abi: CryptoScoreFactoryABI,
    functionName: 'getAllMarkets',
    query: { enabled: !!address && !!CRYPTO_SCORE_FACTORY_ADDRESS },
  })

  // Get all market addresses to check participation
  const marketAddresses = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets)) return []
    return factoryMarkets.map((m: any) => m.marketAddress as `0x${string}`)
  }, [factoryMarkets])

  // Check if user is a participant in each market
  const participantChecks = useMemo(() => {
    return marketAddresses.map((addr) => ({
      address: addr,
      abi: CryptoScoreMarketABI as any,
      functionName: 'isParticipant' as const,
      args: [address],
    }))
  }, [marketAddresses, address])

  const { data: participantResults, isLoading: isLoadingParticipants } = useReadContracts({
    contracts: participantChecks,
    query: {
      enabled: marketAddresses.length > 0 && !!address,
    },
  })

  const isLoading = isLoadingFactory || isLoadingParticipants

  const userMarkets = useMemo(() => {
    if (!factoryMarkets || !participantResults || !Array.isArray(factoryMarkets)) return []

    const now = Date.now() / 1000

    // Filter markets where user is a participant
    const filtered = (factoryMarkets as any[])
      .map((market, index) => {
        const isParticipant = participantResults[index]?.result as boolean
        if (!isParticipant) return null

        return {
          marketAddress: market.marketAddress as `0x${string}`,
          matchId: BigInt(market.matchId?.toString() || '0'),
          entryFee: BigInt(market.entryFee?.toString() || '0'),
          creator: market.creator,
          participantsCount: BigInt(0), // Will be fetched by EnhancedMarketCard
          resolved: false, // Will be fetched by EnhancedMarketCard
          isPublic: market.isPublic,
          startTime: BigInt(market.startTime?.toString() || '0'),
        } as Market
      })
      .filter((m): m is Market => m !== null && Number(m.startTime) > now)
      .sort((a, b) => Number(a.startTime) - Number(b.startTime))

    return filtered
  }, [factoryMarkets, participantResults])

  // Don't render the component if the user is not connected.
  // The homepage will just show the hero and public markets.
  if (!isConnected) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Active Markets
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array.from({ length: 3 })].map((_, i) => <EnhancedMarketCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  // Empty state
  if (!userMarkets || userMarkets.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Active Markets
          </h2>
        </div>
        <div
          className="text-center py-12 border-2 border-dashed rounded-[16px]"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <span className="icon-[mdi--cards-outline] w-16 h-16 mx-auto" style={{ color: 'var(--text-tertiary)' }} />
          <p className="mt-4 font-sans text-lg" style={{ color: 'var(--text-secondary)' }}>
            You haven't joined or created any markets yet.
          </p>
          <p className="font-sans text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Explore the open markets below to get started!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Active Markets
        </h2>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm font-bold hover:underline"
          style={{ color: 'var(--accent-cyan)' }}
        >
          <span>View All</span>
          <span className="icon-[mdi--arrow-right]" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Show the 3 most recent markets */}
        {userMarkets.slice(0, 3).map(market => (
          <EnhancedMarketCard market={market} key={market.marketAddress} />
        ))}
      </div>
    </div>
  )
}
