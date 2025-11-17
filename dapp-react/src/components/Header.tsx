import Connect from './Connect'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--cs-neutral--slate-gray)]/10 bg-[var(--cs-surface)]/80 shadow-[var(--cs-shadow--card)] backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[var(--cs-primary--blue)]"
            >
              <path
                d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 12L22 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 12V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 12L2 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tighter text-[var(--cs-neutral--jet-black)]">
              CryptoScore
            </span>
          </a>
        </div>
        <div className="flex items-center">
          <Connect />
        </div>
      </div>
    </header>
  )
}