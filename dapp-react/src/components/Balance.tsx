import { useBalance } from 'wagmi'

interface BalanceProps {
  address: `0x${string}`
}

export default function Balance({ address }: BalanceProps) {
  const { data: balance, isLoading, error } = useBalance({
    address,
  })

  if (isLoading) {
    return <div className="h-9 w-24 rounded animate-pulse skeleton" />
  }

  if (error) {
    return <span className="font-sans text-lg font-bold" style={{ color: 'var(--accent-red)' }}>Error</span>
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-jakarta font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
        {Number.parseFloat(balance?.formatted || '0').toFixed(3)}
      </span>
      <span className="font-sans font-semibold" style={{ color: 'var(--text-tertiary)' }}>
        PAS
      </span>
    </div>
  )
}
