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
    <div className="flex items-center gap-3">
      {/* Account Info */}
      <div className="flex items-center gap-4 bg-[#F5F7FA] p-2 pr-4 rounded-[14px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          {connectorIcon
            ? (
                <img
                  src={connectorIcon}
                  alt={connectorName || 'Connector'}
                  className="w-6 h-6 rounded-full"
                />
              )
            : (
                <span className="icon-[mdi--wallet] w-6 h-6 text-[#1E293B]" />
              )}
          <span className="font-sans font-semibold text-sm text-[#1E293B] hidden sm:block">
            {shortenAddress(address)}
          </span>
        </div>

        {/* Separator */}
        <div className="border-l border-slate-300 h-6" />

        {/* Balance */}
        <div className="text-sm">
          <Balance address={address} />
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        type="button"
        className="h-10 w-10 flex items-center justify-center rounded-full bg-[#F5F7FA] border border-slate-200 shadow-sm group"
        onClick={handleDisconnect}
        title="Disconnect"
      >
        <span className="icon-[mdi--logout] w-5 h-5 text-slate-500 transition-colors group-hover:text-[#DC2626]" />
      </button>
    </div>
  )
}
