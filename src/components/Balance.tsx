import { useUnifiedWallet } from '@/contexts/UnifiedWalletContext'
import { useMnee } from '@/hooks/useMnee'
import { useBalanceSubscriptionWithToasts } from '@/hooks/useBalanceSubscription'

export default function Balance() {
  const { walletAddress } = useUnifiedWallet()
  const { balance, decimalBalance, isLoadingBalance, balanceError, formatAmount } = useMnee()
  
  // Enable real-time balance updates with toast notifications
  const { isSubscribed, subscriptionError } = useBalanceSubscriptionWithToasts({
    enablePolling: true,
    pollingInterval: 30000,
    enableNotifications: true
  })

  if (isLoadingBalance) {
    return <div className="h-9 w-24 rounded animate-pulse skeleton" />
  }

  if (balanceError) {
    return <span className="font-sans text-lg font-bold" style={{ color: 'var(--accent-red)' }}>Error</span>
  }

  if (!walletAddress) {
    return <span className="font-sans text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>Connect Wallet</span>
  }

  // Use decimal balance for display, fallback to formatted atomic balance
  const displayBalance = decimalBalance !== null 
    ? decimalBalance.toFixed(5)
    : balance !== null 
      ? formatAmount(balance, { includeSymbol: false })
      : '0.00000'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-jakarta font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          {displayBalance}
        </span>
        <span className="font-sans font-semibold" style={{ color: 'var(--text-tertiary)' }}>
          MNEE
        </span>
        {/* Real-time indicator */}
        {isSubscribed && (
          <div 
            className="w-2 h-2 rounded-full animate-pulse" 
            style={{ backgroundColor: 'var(--accent-green)' }}
            title="Real-time updates enabled"
          />
        )}
        {subscriptionError && (
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: 'var(--accent-red)' }}
            title={`Subscription error: ${subscriptionError}`}
          />
        )}
      </div>
      {/* Display EVM address for MNEE operations */}
      <div className="text-xs text-[var(--text-tertiary)] font-mono">
        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </div>
    </div>
  )
}
