import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      return
    }

    // Parallax scroll effect
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Calculate parallax offset (subtle effect - 0.3 multiplier)
  const parallaxOffset = scrollY * 0.3

  return (
    <section className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with glassmorphism overlay and parallax effect */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-100 ease-out"
        style={{
          background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)`,
          transform: `translateY(${parallaxOffset}px)`,
        }}
      >
        {/* Animated gradient overlay with parallax */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 20% 50%, var(--accent-cyan) 0%, transparent 50%),
                         radial-gradient(circle at 80% 50%, var(--accent-purple) 0%, transparent 50%)`,
            animation: 'pulse-glow 8s ease-in-out infinite',
            transform: `translateY(${parallaxOffset * 0.5}px)`,
          }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        {/* Headline with gradient text effect */}
        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in"
          style={{
            background: `linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Predict. Compete. Win.
        </h1>

        {/* Tagline/Value proposition */}
        <div className="max-w-3xl mx-auto mb-12 space-y-3 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <p
            className="text-xl sm:text-2xl md:text-3xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Decentralized Sports Prediction Markets
          </p>
          <p
            className="text-lg sm:text-xl md:text-2xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            Built on Solana. Powered by Community.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          {/* Primary CTA - Explore Markets */}
          <Link
            to="/markets"
            className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover-lift hover-glow"
            style={{
              background: 'var(--accent-cyan)',
              color: 'var(--text-inverse)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            Explore Markets
          </Link>

          {/* Secondary CTA - View Terminal */}
          <Link
            to="/terminal"
            className="px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover-lift"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--accent-cyan)',
              border: '2px solid var(--accent-cyan)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            View Terminal
          </Link>
        </div>

        {/* Animated visual element with sports theme */}
        <div
          className="mt-16 relative animate-fade-in"
          style={{ animationDelay: '0.6s' }}
        >
          {/* Floating prediction cards animation with parallax */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Floating card 1 */}
            <div
              className="absolute top-0 left-1/4 w-32 h-20 rounded-lg opacity-20 animate-parallax-float hover-scale"
              style={{
                background: 'var(--accent-cyan)',
                animationDelay: '0s',
                transform: `translateY(${parallaxOffset * -0.2}px)`,
              }}
            />
            {/* Floating card 2 */}
            <div
              className="absolute top-1/4 right-1/4 w-28 h-16 rounded-lg opacity-20 animate-parallax-float hover-scale"
              style={{
                background: 'var(--accent-green)',
                animationDelay: '1.5s',
                transform: `translateY(${parallaxOffset * -0.15}px)`,
              }}
            />
            {/* Floating card 3 */}
            <div
              className="absolute bottom-1/4 left-1/3 w-24 h-14 rounded-lg opacity-20 animate-parallax-float hover-scale"
              style={{
                background: 'var(--accent-purple)',
                animationDelay: '3s',
                transform: `translateY(${parallaxOffset * -0.25}px)`,
              }}
            />
          </div>

          {/* Glassmorphism card effect with stats */}
          <div
            className="max-w-4xl mx-auto p-8 rounded-2xl relative z-10"
            style={{
              background: 'var(--bg-elevated)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-2xl)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {/* Quick stats preview */}
              <div className="animate-scale-in" style={{ animationDelay: '0.8s' }}>
                <div
                  className="text-3xl md:text-4xl font-bold font-mono mb-2"
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  100+
                </div>
                <div style={{ color: 'var(--text-tertiary)' }}>Active Markets</div>
              </div>
              <div className="animate-scale-in" style={{ animationDelay: '0.9s' }}>
                <div
                  className="text-3xl md:text-4xl font-bold font-mono mb-2"
                  style={{ color: 'var(--accent-green)' }}
                >
                  5%
                </div>
                <div style={{ color: 'var(--text-tertiary)' }}>Platform Fee</div>
              </div>
              <div className="animate-scale-in" style={{ animationDelay: '1s' }}>
                <div
                  className="text-3xl md:text-4xl font-bold font-mono mb-2"
                  style={{ color: 'var(--accent-purple)' }}
                >
                  24/7
                </div>
                <div style={{ color: 'var(--text-tertiary)' }}>Instant Payouts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
          style={{ animationDelay: '1.2s' }}
        >
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Scroll to explore
            </span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--accent-cyan)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
