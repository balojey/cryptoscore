import type { MarketDashboardInfo } from '../types'
import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import { MarketInfoCard } from './MarketInfoCard'

export function UserMarkets() {
  const { address } = useAccount()
  const [createdMarkets, setCreatedMarkets] = useState<MarketDashboardInfo[]>([])
  const [joinedMarkets, setJoinedMarkets] = useState<MarketDashboardInfo[]>([])
  const [loading, setLoading] = useState(true)

  const { data: createdMarketAddresses } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserCreatedMarkets',
    args: [address!],
    query: {
      enabled: !!address,
    },
  })

  const { data: joinedMarketAddresses } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserJoinedMarkets',
    args: [address!],
    query: {
      enabled: !!address,
    },
  })

  const { data: createdMarketsData } = useReadContracts({
    contracts: createdMarketAddresses?.map((marketAddress: string) => ({
      abi: CryptoScoreDashboardABI,
      address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
      functionName: 'marketInfoByAddress',
      args: [marketAddress],
    })),
    query: {
      enabled: Array.isArray(createdMarketAddresses) && createdMarketAddresses.length > 0,
    },
  })

  const { data: joinedMarketsData } = useReadContracts({
    contracts: joinedMarketAddresses?.map((marketAddress: string) => ({
      abi: CryptoScoreDashboardABI,
      address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
      functionName: 'marketInfoByAddress',
      args: [marketAddress],
    })),
    query: {
      enabled: Array.isArray(joinedMarketAddresses) && joinedMarketAddresses.length > 0,
    },
  })

  useEffect(() => {
    if (createdMarketsData) {
      const markets = createdMarketsData
        .map((data: typeof createdMarketsData[number]) => data.result as MarketDashboardInfo)
        .filter(Boolean)
      setCreatedMarkets(markets)
    }
    if (joinedMarketsData) {
      const markets = joinedMarketsData
        .map((data: typeof joinedMarketsData[number]) => data.result as MarketDashboardInfo)
        .filter(Boolean)
      setJoinedMarkets(markets)
    }
    if (createdMarketAddresses || joinedMarketAddresses) {
      setLoading(false)
    }
  }, [createdMarketsData, joinedMarketsData, createdMarketAddresses, joinedMarketAddresses])

  if (!address) {
    return null
  }

  if (loading) {
    return <div>Loading your markets...</div>
  }

  const publicCreated = createdMarkets.filter(m => m.isPublic)
  const privateCreated = createdMarkets.filter(m => !m.isPublic)
  const publicJoined = joinedMarkets.filter(m => m.isPublic)
  const privateJoined = joinedMarkets.filter(m => !m.isPublic)

  return (
    <>
      <section className="mt-6">
        <h2 className="text-xl font-bold mb-2">Your Created Markets</h2>
        {(!publicCreated.length && !privateCreated.length) && <p>No created markets yet.</p>}

        {publicCreated.length > 0 && (
          <>
            <h3 className="text-md font-semibold mt-2">Public</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {publicCreated.map(m => <MarketInfoCard key={m.marketAddress} market={m} />)}
            </div>
          </>
        )}

        {privateCreated.length > 0 && (
          <>
            <h3 className="text-md font-semibold mt-4">Private</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {privateCreated.map(m => <MarketInfoCard key={m.marketAddress} market={m} />)}
            </div>
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-2">Markets You Joined</h2>
        {(!publicJoined.length && !privateJoined.length) && <p>No joined markets yet.</p>}

        {publicJoined.length > 0 && (
          <>
            <h3 className="text-md font-semibold mt-2">Public</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {publicJoined.map(m => <MarketInfoCard key={m.marketAddress} market={m} />)}
            </div>
          </>
        )}

        {privateJoined.length > 0 && (
          <>
            <h3 className="text-md font-semibold mt-4">Private</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {privateJoined.map(m => <MarketInfoCard key={m.marketAddress} market={m} />)}
            </div>
          </>
        )}
      </section>
    </>
  )
}
