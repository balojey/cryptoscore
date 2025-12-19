import { useState } from 'react'
import { WinningsCalculator } from '../../utils/winnings-calculator'
import { useCurrency } from '../../hooks/useCurrency'
import type { MarketData } from '../../hooks/useMarketData'

interface PotentialWinningsDisplayProps {
  marketData: MarketData
  selectedPrediction?: 'Home' | 'Draw' | 'Away'
  className?: string
}

export function PotentialWinningsDisplay({ 
  marketData, 
  selectedPrediction,
  className = '' 
}: PotentialWinningsDisplayProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { formatCurrency } = useCurrency()
  
  const averageWinnings = WinningsCalculator.calculateAveragePotentialWinnings(marketData)
  
  // If user has selected a specific prediction, show that alongside the average
  const selectedWinnings = selectedPrediction 
    ? WinningsCalculator.calculatePotentialWinnings(marketData, selectedPrediction, false)
    : null

  return (
    <div className={`p-3 rounded-lg border-2 ${className}`} style={{ 
      background: 'var(--accent-cyan)/10', 
      borderColor: 'var(--accent-cyan)/20' 
    }}>
      {/* Main display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="icon-[mdi--trending-up] w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {selectedPrediction ? `${selectedPrediction} prediction:` : 'Average potential winnings:'}
          </span>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--accent-cyan)' }}
        >
          {showBreakdown ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <div className="mt-1">
        {selectedPrediction && selectedWinnings !== null ? (
          <div className="space-y-1">
            <div className="font-semibold text-lg" style={{ color: 'var(--accent-cyan)' }}>
              {formatCurrency(selectedWinnings)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Average across all predictions: {formatCurrency(averageWinnings.average)}
            </div>
          </div>
        ) : (
          <div className="font-semibold text-lg" style={{ color: 'var(--accent-cyan)' }}>
            {formatCurrency(averageWinnings.average)}
          </div>
        )}
      </div>

      {/* Breakdown details */}
      {showBreakdown && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {averageWinnings.explanation}
          </div>
          
          <div className="space-y-1">
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Potential winnings by prediction:
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col items-center p-2 rounded bg-white/5">
                <span style={{ color: 'var(--text-secondary)' }}>Home</span>
                <span className="font-medium" style={{ color: 'var(--accent-cyan)' }}>
                  {formatCurrency(averageWinnings.breakdown.Home)}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {marketData.homeCount + 1} winners
                </span>
              </div>
              
              <div className="flex flex-col items-center p-2 rounded bg-white/5">
                <span style={{ color: 'var(--text-secondary)' }}>Draw</span>
                <span className="font-medium" style={{ color: 'var(--accent-cyan)' }}>
                  {formatCurrency(averageWinnings.breakdown.Draw)}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {marketData.drawCount === 0 ? '1 winner' : `${marketData.drawCount + 1} winners`}
                </span>
              </div>
              
              <div className="flex flex-col items-center p-2 rounded bg-white/5">
                <span style={{ color: 'var(--text-secondary)' }}>Away</span>
                <span className="font-medium" style={{ color: 'var(--accent-cyan)' }}>
                  {formatCurrency(averageWinnings.breakdown.Away)}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {marketData.awayCount + 1} winners
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs pt-2 border-t border-white/10" style={{ color: 'var(--text-tertiary)' }}>
            💡 Tip: Predictions with fewer participants offer higher potential winnings but may be riskier.
          </div>
        </div>
      )}
    </div>
  )
}