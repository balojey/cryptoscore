import { useEffect, useState } from 'react'
import { useUnifiedWallet } from '@/contexts/UnifiedWalletContext'
import { useCurrency } from '@/hooks/useCurrency'

export default function Balance() {
  const { publicKey } = useUnifiedWallet()
  const { currency, formatCurrency } = useCurrency()
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!publicKey) {
      setBalance(0)
      setIsLoading(false)
      return
    }

    // TODO: Implement Supabase balance fetching
    // For now, show a placeholder balance
    setBalance(1000) // Placeholder balance
    setIsLoading(false)
  }, [publicKey])

  if (isLoading) {
    return <div className="h-9 w-24 rounded animate-pulse skeleton" />
  }

  if (error) {
    return <span className="font-sans text-lg font-bold" style={{ color: 'var(--accent-red)' }}>Error</span>
  }

  // Format the primary display value
  const primaryValue = formatCurrency(balance, { showSymbol: false })

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-jakarta font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          {primaryValue}
        </span>
        <span className="font-sans font-semibold" style={{ color: 'var(--text-tertiary)' }}>
          {currency}
        </span>
      </div>
    </div>
  )
}
