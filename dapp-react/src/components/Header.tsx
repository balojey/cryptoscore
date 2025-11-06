import Connect from './Connect'

export default function Header() {
  return (
    <div className="navbar bg-base-100 border-b border-gray-200">
      <div className="container mx-auto flex items-center">
        <div className="navbar-start">
          <div className="flex items-center">
            <span className="text-xl font-bold font-mono text-black tracking-wide ml-1">
              CryptoScore
            </span>
          </div>
        </div>
        <div className="navbar-end">
          <Connect />
        </div>
      </div>
    </div>
  )
}
