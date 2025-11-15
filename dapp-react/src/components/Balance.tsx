import { useBalance } from 'wagmi'

interface BalanceProps {
  address: `0x${string}`
}

export default function Balance({ address }: BalanceProps) {
  const { data: balance, isLoading, error } = useBalance({
    address,
  })

  if (isLoading) {
    return <span className="font-mono font-semibold">...</span>
  }

  if (error) {
    return <span className="font-mono font-semibold text-red-500">Error</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-semibold">
        {balance?.formatted || '0'}
        {' '}
        PAS
      </span>
      <a
        href="https://faucet.polkadot.io/?parachain=1111"
        target="_blank"
        rel="noreferrer"
        className="icon-[mdi--faucet] w-4 h-4 text-gray-400 hover:text-gray-600"
        title="Get more PAS from faucet"
      />
    </div>
  )
}
