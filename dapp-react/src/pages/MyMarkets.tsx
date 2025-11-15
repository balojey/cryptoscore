import type { MarketDashboardInfo } from '../types'
import { useAccount, useReadContract } from 'wagmi'
import { MarketInfoCard } from '../components/MarketInfoCard'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'

export function MyMarkets() {
  const { address } = useAccount()

  const { data: createdMarkets, isLoading: isLoadingCreated } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserMarketsDashboardPaginated',
    args: [address, 0, 100, true], // createdOnly = true
    query: {
      enabled: !!address,
    },
  }) as { data: MarketDashboardInfo[] | undefined; isLoading: boolean }

  const { data: joinedMarkets, isLoading: isLoadingJoined } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserMarketsDashboardPaginated',
    args: [address, 0, 100, false], // createdOnly = false
    query: {
      enabled: !!address,
    },
  }) as { data: MarketDashboardInfo[] | undefined; isLoading: boolean }

  const privateCreatedMarkets = createdMarkets?.filter(market => !market.isPublic) || []
  const publicCreatedMarkets = createdMarkets?.filter(market => market.isPublic) || []
  const privateJoinedMarkets = joinedMarkets?.filter(market => !market.isPublic) || []
  const publicJoinedMarkets = joinedMarkets?.filter(market => market.isPublic) || []

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">My Markets</h1>
        <p>Please connect your wallet to see your markets.</p>
      </div>
    )
  }

  const renderMarketList = (markets: MarketDashboardInfo[], emptyMessage: string) => {
    if (isLoadingCreated || isLoadingJoined) {
      return <p>Loading...</p>
    }
    if (markets.length === 0) {
      return <p>{emptyMessage}</p>
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map(market => (
          <MarketInfoCard market={market} key={market.marketAddress} />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Markets</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Private Markets You Created (
            {privateCreatedMarkets.length}
            )
          </h2>
          {renderMarketList(
            privateCreatedMarkets,
            'You haven\'t created any private markets yet.',
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Public Markets You Created (
            {publicCreatedMarkets.length}
            )
          </h2>
          {renderMarketList(
            publicCreatedMarkets,
            'You haven\'t created any public markets yet.',
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Private Markets You Joined (
            {privateJoinedMarkets.length}
            )
          </h2>
          {renderMarketList(
            privateJoinedMarkets,
            'You haven\'t joined any private markets yet.',
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Public Markets You Joined (
            {publicJoinedMarkets.length}
            )
          </h2>
          {renderMarketList(
            publicJoinedMarkets,
            'You haven\'t joined any public markets yet.',
          )}
        </section>
      </div>
    </div>
  )
}
