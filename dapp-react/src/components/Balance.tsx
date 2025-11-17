import { useBalance } from 'wagmi'

interface BalanceProps {
  address: `0x${string}`
}

export default function Balance({ address }: BalanceProps) {
  const { data: balance, isLoading, error } = useBalance({
    address,
  })

  if (isLoading) {
    return <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
  }

  if (error) {
    return <span className="font-sans text-lg font-bold text-[#DC2626]">Error</span>
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-jakarta font-bold text-2xl text-[#1E293B]">
        {parseFloat(balance?.formatted || '0').toFixed(3)}
      </span>
      <span className="font-sans font-semibold text-slate-500">
        PAS
      </span>
    </div>
  )
}