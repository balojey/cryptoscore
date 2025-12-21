import { Link } from 'react-router-dom'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import Connect from '../Connect'

export default function FinalCTA() {
  const { connected } = useUnifiedWallet()

  return (
    <section
      className="py-16 md:py-24 lg:py-32 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
      aria-labelledby="final-cta-heading"
    >
      {/* Animated background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 30% 50%, var(--accent-cyan) 0%, transparent 50%),
                         radial-gradient(circle at 70% 50%, var(--accent-purple) 0%, transparent 50%)`,
            animation: 'pulse-glow 6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glassmorphism card */}
        <div
          className="p-8 md:p-12 lg:p-16 rounded-3xl text-center"
          style={{
            background: 'var(--bg-elevated)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-2xl)',
          }}
        >
          {/* Bold headline with gradient text effect */}
          <h2
            id="final-cta-heading"
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in"
            style={{
              background: `linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Ready to Start Winning?
          </h2>

          {/* Supporting tagline */}
          <p
            className="text-lg sm:text-xl md:text-2xl mb-10 max-w-2xl mx-auto animate-slide-in-up"
            style={{
              color: 'var(--text-secondary)',
              animationDelay: '0.1s',
            }}
          >
            Join the future of sports predictions. Make your first prediction today.
          </p>

          {/* Dual CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in"
            style={{ animationDelay: '0.2s' }}
          >
            {/* Primary CTA - Explore Markets */}
            <Link
              to="/markets"
              className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover-lift hover-glow"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-lg)',
              }}
              aria-label="Explore prediction markets"
            >
              Explore Markets
            </Link>

            {/* Secondary CTA - Connect Wallet (conditional) */}
            {!connected
              ? (
                  <Connect />
                )
              : (
                  <Link
                    to="/terminal"
                    className="px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover-lift"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--accent-cyan)',
                      border: '2px solid var(--accent-cyan)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    aria-label="View trading terminal"
                  >
                    View Terminal
                  </Link>
                )}
          </div>

          {/* Additional trust indicators */}
          <div
            className="mt-12 pt-8 border-t animate-fade-in"
            style={{
              borderColor: 'var(--border-default)',
              animationDelay: '0.3s',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div
                  className="text-2xl md:text-3xl font-bold font-mono mb-1"
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  100%
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  On-Chain
                </div>
              </div>
              <div>
                <div
                  className="text-2xl md:text-3xl font-bold font-mono mb-1"
                  style={{ color: 'var(--accent-green)' }}
                >
                  5%
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Total Fees
                </div>
              </div>
              <div>
                <div
                  className="text-2xl md:text-3xl font-bold font-mono mb-1"
                  style={{ color: 'var(--accent-purple)' }}
                >
                  Instant
                </div>
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Payouts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
