export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{ borderTop: '1px solid var(--border-default)' }}
    >
      <div className="max-w-screen-2xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Copyright © 2025 CryptoScore. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/balojey"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            aria-label="CryptoScore on X"
          >
            <span className="icon-[mdi--twitter] size-5" />
          </a>
          <a
            href="https://github.com/balojey/cryptoscore-solana"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            aria-label="CryptoScore on GitHub"
          >
            <span className="icon-[mdi--github] size-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
