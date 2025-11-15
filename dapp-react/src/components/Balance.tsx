import { useBalance } from 'wagmi'

interface BalanceProps {
  address: `0x${string}`
}

export default function Balance({ address }: BalanceProps) {
  const { data: balance, isLoading, error } = useBalance({
    address,
  })

  if (isLoading) {
    return <span className="font-sans text-sm font-medium text-slate-500">...</span>
  }

  if (error) {
    return <span className="font-sans text-sm font-medium text-[#DC2626]">Error</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-sans text-sm font-semibold text-[#1E293B]">
        {parseFloat(balance?.formatted || '0').toFixed(2)}
        {' '}
        <span className="text-slate-400">PAS</span>
      </span>
      <a
        href="https://faucet.polkadot.io/?parachain=1111"
        target="_blank"
        rel="noreferrer"
        className="icon-[mdi--faucet] w-4 h-4 text-slate-400 transition-colors hover:text-[#0A84FF]"
        title="Get more PAS from faucet"
      />
    </div>
  )
}
