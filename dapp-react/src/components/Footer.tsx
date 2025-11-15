export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--cs-neutral--slate-gray)]/10">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-[var(--cs-text--primary)]/60">
          Copyright © 2025 CryptoScore. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/balojey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--cs-text--primary)]/60 transition-colors hover:text-[var(--cs-primary--blue)]"
            aria-label="CryptoScore on X"
          >
            <span className="icon-[mdi--twitter] size-5" />
          </a>
          <a
            href="https://github.com/balojey/cryptoscore"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--cs-text--primary)]/60 transition-colors hover:text-[var(--cs-primary--blue)]"
            aria-label="CryptoScore on GitHub"
          >
            <span className="icon-[mdi--github] size-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}