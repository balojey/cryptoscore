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

  // Get all market addresses to check participation and resolved status
  const marketAddresses = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets))
      return []
    return factoryMarkets.map((m: any) => m.marketAddress as `0x${string}`)
  }, [factoryMarkets])

  // Build contracts array for batch reading
  const contractCalls = useMemo(() => {
    const calls = []
    for (const addr of marketAddresses) {
      // Check if user is a participant
      calls.push({
        address: addr,
        abi: CryptoScoreMarketABI as any,
        functionName: 'isParticipant' as const,
        args: [address],
      })
      // Check if market is resolved
      calls.push({
        address: addr,
        abi: CryptoScoreMarketABI as any,
        functionName: 'resolved' as const,
      })
      // Get participants count
      calls.push({
        address: addr,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getParticipantsCount' as const,
      })
    }
    return calls
  }, [marketAddresses, address])

  const { data: contractResults, isLoading: isLoadingContracts } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: marketAddresses.length > 0 && !!address,
    },
  })

  const isLoading = isLoadingFactory || isLoadingContracts

  const userMarkets = useMemo(() => {
    if (!factoryMarkets || !contractResults || !Array.isArray(factoryMarkets))
      return []

    const now = Date.now() / 1000

    // Filter markets where user is creator OR participant, and market is open/ending soon/unresolved
    const filtered = (factoryMarkets as any[])
      .map((market, index) => {
        const resultIndex = index * 3
        const isParticipant = contractResults[resultIndex]?.result as boolean
        const isResolved = contractResults[resultIndex + 1]?.result as boolean
        const participantsCount = contractResults[resultIndex + 2]?.result as bigint

        const isCreator = address?.toLowerCase() === market.creator?.toLowerCase()

        // Include if user is creator OR participant
        if (!isCreator && !isParticipant)
          return null

        // Exclude resolved markets
        if (isResolved)
          return null

        const startTime = BigInt(market.startTime?.toString() || '0')
        const startTimeSeconds = Number(startTime)

        // Only include markets that haven't started yet or are within 2 hours of ending
        // (Open, Ending Soon, or Live status)
        if (startTimeSeconds < now - 7200)
          return null // Exclude if more than 2 hours past start

        return {
          marketAddress: market.marketAddress as `0x${string}`,
          matchId: BigInt(market.matchId?.toString() || '0'),
          entryFee: BigInt(market.entryFee?.toString() || '0'),
          creator: market.creator,
          participantsCount: participantsCount || BigInt(0),
          resolved: isResolved || false,
          isPublic: market.isPublic,
          startTime,
        } as Market
      })
      .filter((m): m is Market => m !== null)
      // Sort by start time (earliest first)
      .sort((a, b) => Number(a.startTime) - Number(b.startTime))

    return filtered
  }, [factoryMarkets, contractResults, address])

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
