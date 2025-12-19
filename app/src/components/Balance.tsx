import { useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { useUnifiedWallet } from '@/contexts/UnifiedWalletContext'
import { useCurrency } from '@/hooks/useCurrency'

export default function Balance() {
  const { connection } = useConnection()
  const { publicKey } = useUnifiedWallet()
  const { currency, formatCurrency, convertFromLamports } = useCurrency()
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!publicKey) {
      setBalanceLamports(null)
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)

    connection.getBalance(publicKey)
      .then((lamports) => {
        if (isMounted) {
          setBalanceLamports(lamports)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [publicKey, connection])

  if (isLoading) {
    return <div className="h-9 w-24 rounded animate-pulse skeleton" />
  }

  if (error) {
    return <span className="font-sans text-lg font-bold" style={{ color: 'var(--accent-red)' }}>Error</span>
  }

  const lamports = balanceLamports || 0

  // Format the primary display value
  const primaryValue = formatCurrency(lamports, { showSymbol: false })
  const currencySymbol = currency === 'SOL' ? '◎' : currency === 'USD' ? '$' : '₦'

  // Calculate SOL equivalent if not already in SOL
  const solEquivalent = currency !== 'SOL' ? (lamports / LAMPORTS_PER_SOL).toFixed(4) : null

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
      {solEquivalent && (
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
            ◎
            {solEquivalent}
            {' '}
            SOL
          </span>
        </div>
      )}
    </div>
  )
}
