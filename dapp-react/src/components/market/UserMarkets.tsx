import type { Market } from '../../types'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../../config/contracts'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../cards/EnhancedMarketCard'

export function UserMarkets() {
  const { address, isConnected } = useAccount()

  // Fetch user's market addresses from factory
  const { data: userMarketAddresses, isLoading: isLoadingAddresses } = useReadContract({
    abi: CryptoScoreFactoryABI,
    address: CRYPTO_SCORE_FACTORY_ADDRESS as `0x${string}`,
    functionName: 'getUserMarkets',
    args: [address],
    query: { enabled: !!address && !!CRYPTO_SCORE_FACTORY_ADDRESS },
  })

  // Get market info from factory for each address
  const marketAddresses = useMemo(() => {
    if (!userMarketAddresses || !Array.isArray(userMarketAddresses)) return []
    return userMarketAddresses.slice(0, 10) as `0x${string}`[] // Limit to 10 most recent
  }, [userMarketAddresses])

  // Fetch market info from factory
  const { data: factoryMarketInfo, isLoading: isLoadingFactory } = useReadContracts({
    contracts: marketAddresses.map(marketAddress => ({
      address: CRYPTO_SCORE_FACTORY_ADDRESS as `0x${string}`,
      abi: CryptoScoreFactoryABI as any,
      functionName: 'getMarketInfo',
      args: [marketAddress],
    })),
  })

  // Fetch detailed data from individual market contracts
  const { data: marketDetails, isLoading: isLoadingDetails } = useReadContracts({
    contracts: marketAddresses.flatMap(marketAddress => [
      {
        address: marketAddress,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getParticipantsCount',
      },
      {
        address: marketAddress,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getPredictionCounts',
      },
      {
        address: marketAddress,
        abi: CryptoScoreMarketABI as any,
        functionName: 'resolved',
      },
    ]),
  })

  const isLoadingCreated = isLoadingAddresses || isLoadingFactory || isLoadingDetails
  const isLoadingJoined = false // No longer needed

  const userMarkets = useMemo(() => {
    if (!factoryMarketInfo || !marketDetails) return []

    return marketAddresses.map((_, index) => {
      const factoryInfo = factoryMarketInfo[index]?.result as any
      const detailsIndex = index * 3
      const participantsCount = marketDetails[detailsIndex]?.result as bigint | undefined
      const predictionCounts = marketDetails[detailsIndex + 1]?.result as [bigint, bigint, bigint] | undefined
      const resolved = marketDetails[detailsIndex + 2]?.result as boolean | undefined

      if (!factoryInfo) return null

      return {
        marketAddress: factoryInfo.marketAddress,
        matchId: factoryInfo.matchId,
        entryFee: factoryInfo.entryFee,
        creator: factoryInfo.creator,
        participantsCount: participantsCount || BigInt(0),
        resolved: resolved || false,
        isPublic: factoryInfo.isPublic,
        startTime: factoryInfo.startTime,
        homeCount: predictionCounts?.[0] || BigInt(0),
        awayCount: predictionCounts?.[1] || BigInt(0),
        drawCount: predictionCounts?.[2] || BigInt(0),
      } as Market
    }).filter(Boolean) as Market[]
  }, [marketAddresses, factoryMarketInfo, marketDetails])

  // Don't render the component if the user is not connected.
  // The homepage will just show the hero and public markets.
  if (!isConnected) {
    return null
  }

  // Loading state
  if (isLoadingCreated || isLoadingJoined) {
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
