import { useEffect, useRef, useState } from 'react'

interface BenefitItem {
  icon: string
  title: string
  description: string
  expandedDetails: string
  comparison?: {
    traditional: string
    cryptoscore: string
  }
  color: string
}

const benefits: BenefitItem[] = [
  {
    icon: 'mdi--shield-lock-outline',
    title: 'No Intermediaries',
    description: 'Your funds, your control. Smart contracts handle everything automatically.',
    expandedDetails: 'Unlike traditional betting platforms that hold your funds in centralized accounts, CryptoScore uses smart contracts on Solana. You maintain full custody until you choose to participate, and payouts are automatic with no withdrawal delays or approval processes.',
    color: 'var(--accent-cyan)',
  },
  {
    icon: 'mdi--chart-line',
    title: 'Transparent Odds',
    description: 'See exactly how pools are distributed. No hidden manipulation.',
    expandedDetails: 'Every prediction and pool distribution is recorded on-chain and publicly verifiable. You can see real-time odds based on actual participant predictions, not house-controlled odds that can be adjusted to maximize platform profits.',
    color: 'var(--accent-green)',
  },
  {
    icon: 'mdi--cash-minus',
    title: 'Lower Fees',
    description: '5% total fee vs 5-10% on traditional platforms. More winnings for you.',
    expandedDetails: 'Traditional betting platforms charge 5-10% in fees and margins. CryptoScore charges only 5% total (2% creator fee, 3% protocol fee) with complete transparency. No hidden charges, no withdrawal fees, no account maintenance costs.',
    comparison: {
      traditional: '5-10% fees',
      cryptoscore: '5% fees',
    },
    color: 'var(--accent-amber)',
  },
  {
    icon: 'mdi--clock-fast',
    title: 'Instant Payouts',
    description: 'Winners get paid automatically when markets resolve. No waiting.',
    expandedDetails: 'Smart contracts automatically distribute winnings to all correct predictors the moment a market resolves. No manual withdrawal requests, no processing delays, no verification holds. Your winnings are available instantly.',
    color: 'var(--accent-purple)',
  },
  {
    icon: 'mdi--account-multiple',
    title: 'Community Powered',
    description: 'Create markets, share predictions, compete on leaderboards.',
    expandedDetails: 'Anyone can create prediction markets for upcoming matches. Build your reputation on the leaderboard, share your predictions with the community, and participate in a truly decentralized prediction ecosystem where users drive the platform.',
    color: 'var(--accent-red)',
  },
]

export default function WhyCryptoScore() {
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const handleBenefitClick = (index: number) => {
    setExpandedBenefit(expandedBenefit === index ? null : index)
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleBenefitClick(index)
    }
  }

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 lg:py-32 relative"
      style={{ background: 'var(--bg-primary)' }}
      aria-labelledby="why-cryptoscore-heading"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            id="why-cryptoscore-heading"
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Why Choose CryptoScore?
          </h2>
          <p
            className="text-lg md:text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Experience the advantages of decentralized prediction markets over traditional betting platforms
          </p>
        </div>

        {/* Benefits List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`relative ${isVisible ? 'animate-slide-in-up' : 'opacity-0'}`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Benefit Card */}
              <div
                className="rounded-2xl transition-all duration-300 cursor-pointer"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `2px solid ${expandedBenefit === index ? benefit.color : 'var(--border-default)'}`,
                  boxShadow: expandedBenefit === index
                    ? `0 0 30px ${benefit.color}40, var(--shadow-2xl)`
                    : 'var(--shadow-md)',
                }}
                onClick={() => handleBenefitClick(index)}
                onKeyDown={e => handleKeyDown(e, index)}
                role="button"
                tabIndex={0}
                aria-expanded={expandedBenefit === index}
                aria-label={`${benefit.title}: ${benefit.description}`}
              >
                {/* Main Content */}
                <div className="p-6 md:p-8 flex items-start gap-4 md:gap-6">
                  {/* Checkmark Icon */}
                  <div
                    className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${benefit.color}40, ${benefit.color}60)`,
                      transform: expandedBenefit === index ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <span
                      className={`icon-[${benefit.icon}] w-6 h-6 md:w-7 md:h-7`}
                      style={{ color: benefit.color }}
                    />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-display text-xl md:text-2xl font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {benefit.title}
                    </h3>
                    <p
                      className="text-sm md:text-base leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {benefit.description}
                    </p>

                    {/* Comparison Highlight */}
                    {benefit.comparison && (
                      <div className="mt-4 flex items-center gap-4 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                          <span
                            className="icon-[mdi--close-circle] w-5 h-5"
                            style={{ color: 'var(--accent-red)' }}
                          />
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            {benefit.comparison.traditional}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="icon-[mdi--check-circle] w-5 h-5"
                            style={{ color: 'var(--accent-green)' }}
                          />
                          <span
                            className="font-semibold"
                            style={{ color: benefit.color }}
                          >
                            {benefit.comparison.cryptoscore}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Indicator */}
                  <div className="flex-shrink-0">
                    <span
                      className={`icon-[mdi--chevron-down] w-6 h-6 transition-transform duration-300 ${
                        expandedBenefit === index ? 'rotate-180' : ''
                      }`}
                      style={{ color: 'var(--text-tertiary)' }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedBenefit === index && (
                  <div
                    className="px-6 md:px-8 pb-6 md:pb-8 pt-0 animate-slide-in-up"
                    style={{
                      borderTop: `1px solid ${benefit.color}40`,
                    }}
                  >
                    <div
                      className="mt-4 p-4 md:p-6 rounded-xl text-sm md:text-base leading-relaxed"
                      style={{
                        background: `${benefit.color}10`,
                        border: `1px solid ${benefit.color}30`,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {benefit.expandedDetails}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p
            className="text-lg md:text-xl mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            Ready to experience the difference?
          </p>
          <a
            href="/markets"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover-lift hover-glow"
            style={{
              background: 'var(--accent-cyan)',
              color: 'var(--text-inverse)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span>Explore Markets</span>
            <span className="icon-[mdi--arrow-right] w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
