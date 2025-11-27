import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useEffect, useState } from 'react'

export default function Balance() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!publicKey) {
      setBalance(null)
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)

    connection.getBalance(publicKey)
      .then((lamports) => {
        if (isMounted) {
          setBalance(lamports / LAMPORTS_PER_SOL)
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

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-jakarta font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
        {(balance || 0).toFixed(3)}
      </span>
      <span className="font-sans font-semibold" style={{ color: 'var(--text-tertiary)' }}>
        SOL
      </span>
    </div>
  )
}
