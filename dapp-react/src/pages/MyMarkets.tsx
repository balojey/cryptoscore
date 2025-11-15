import type { MarketDashboardInfo } from '../types'
import { useMemo, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import MarketCard, { MarketCardSkeleton } from '../components/MarketCard'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'

const MarketList = ({ markets, isLoading, emptyMessage }: { markets: MarketDashboardInfo[], isLoading: boolean, emptyMessage: string }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <MarketCardSkeleton key={i} />)}
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-[16px]">
        <span className="icon-[mdi--database-off-outline] w-16 h-16 text-slate-300 mx-auto" />
        <p className="mt-4 font-sans text-lg text-slate-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {markets.map(market => (
        <MarketCard market={market} key={market.marketAddress} variant="compact" />
      ))}
    </div>
  )
}

export function MyMarkets() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created')

  const { data: allInvolvedMarkets, isLoading: isLoadingInvolved } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserMarketsDashboardPaginated',
    args: [address, 0, 100, false], // createdOnly = false -> gets all
    query: { enabled: !!address },
  }) as { data: MarketDashboardInfo[] | undefined, isLoading: boolean }

  const { createdMarkets, joinedMarkets } = useMemo(() => {
    const created: MarketDashboardInfo[] = []
    const joined: MarketDashboardInfo[] = []

    if (allInvolvedMarkets && address) {
      allInvolvedMarkets.forEach((market) => {
        if (market.creator.toLowerCase() === address.toLowerCase()) {
          created.push(market)
        }
        else {
          joined.push(market)
        }
      })
    }
    return { createdMarkets: created, joinedMarkets: joined }
  }, [allInvolvedMarkets, address])

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <span className="icon-[mdi--wallet-outline] w-24 h-24 text-slate-300 mx-auto" />
        <h1 className="font-jakarta text-3xl font-bold text-[#1E293B] mt-4">Connect Your Wallet</h1>
        <p className="text-lg text-slate-500 mt-2">Please connect your wallet to view your markets.</p>
      </div>
    )
  }

  const TabButton = ({ label, value, activeValue, setActive }: { label: string, value: typeof activeTab, activeValue: typeof activeTab, setActive: (v: typeof activeTab) => void }) => (
    <button
      type="button"
      onClick={() => setActive(value)}
      className={`px-6 py-3 font-sans font-bold text-base rounded-t-[12px] border-b-4 transition-colors ${
        activeValue === value
          ? 'text-[#0A84FF] border-[#0A84FF]'
          : 'text-slate-500 border-transparent hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="bg-[#F5F7FA] min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <h1 className="font-jakarta text-4xl font-bold text-[#1E293B]">My Markets</h1>
          <div className="border-b border-slate-200 flex">
            <TabButton label="Created" value="created" activeValue={activeTab} setActive={setActiveTab} />
            <TabButton label="Joined" value="joined" activeValue={activeTab} setActive={setActiveTab} />
          </div>
        </div>

        <div className="space-y-8">
          {activeTab === 'created' && (
            <MarketList
              markets={createdMarkets}
              isLoading={isLoadingInvolved}
              emptyMessage="You haven't created any markets yet."
            />
          )}
          {activeTab === 'joined' && (
            <MarketList
              markets={joinedMarkets}
              isLoading={isLoadingInvolved}
              emptyMessage="You haven't joined any markets yet."
            />
          )}
        </div>
      </div>
    </div>
  )
}
