import { useDisconnect } from 'wagmi'
import { shortenAddress } from '../utils/formatters'
import Balance from './Balance'

interface AccountProps {
  address: `0x${string}`
  connectorName: string | undefined
  connectorIcon: string | undefined
}

export default function Account({ address, connectorName, connectorIcon }: AccountProps) {
  const { disconnect } = useDisconnect()

  function handleDisconnect() {
    disconnect()
    localStorage.clear()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          {connectorIcon
            ? (
                <img
                  src={connectorIcon}
                  alt={connectorName}
                  className="w-5 h-5"
                />
              )
            : (
                <span className="icon-[mdi--wallet] w-5 h-5" />
              )}
          <span className="font-mono font-semibold text-sm hidden sm:block">
            {shortenAddress(address)}
          </span>
        </div>
        <div className="border-l border-gray-300 h-6" />
        <div className="text-sm">
          <Balance address={address} />
        </div>
      </div>
      <button
        type="button"
        className="btn btn-outline btn-sm font-mono"
        onClick={handleDisconnect}
      >
        <span className="icon-[mdi--logout] w-4 h-4" />
      </button>
    </div>
  )
}
