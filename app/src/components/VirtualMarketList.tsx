import type { Market, MarketDashboardInfo } from '../types'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import EnhancedMarketCard from './cards/EnhancedMarketCard'

interface VirtualMarketListProps {
  markets: Market[] | MarketDashboardInfo[]
  columns?: 1 | 2 | 3
}

export default function VirtualMarketList({ markets, columns = 3 }: VirtualMarketListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate items per row based on columns
  const itemsPerRow = columns
  const rows = Math.ceil(markets.length / itemsPerRow)

  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated height of market card
    overscan: 2, // Render 2 extra rows above/below viewport
  })

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border-default) transparent',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * itemsPerRow
          const rowMarkets = markets.slice(startIndex, startIndex + itemsPerRow)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className={`grid gap-6 ${
                  columns === 1
                    ? 'grid-cols-1'
                    : columns === 2
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                {rowMarkets.map(market => (
                  <EnhancedMarketCard key={market.marketAddress} market={market} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
