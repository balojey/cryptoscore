import { useEffect, useRef, useState } from 'react'

interface FeatureItem {
  icon: string
  title: string
  description: string
  color: string
}

const features: FeatureItem[] = [
  {
    icon: 'mdi--shield-check-outline',
    title: 'Fully Decentralized',
    description: 'No intermediaries. Your funds are secured by smart contracts on Solana',
    color: 'var(--accent-cyan)',
  },
  {
    icon: 'mdi--eye-outline',
    title: 'Transparent & Fair',
    description: 'All predictions and outcomes are recorded on-chain. Verifiable by anyone',
    color: 'var(--accent-green)',
  },
  {
    icon: 'mdi--cash-multiple',
    title: 'Low Fees',
    description: 'Only 5% platform fee (2% creator, 3% protocol). No hidden charges',
    color: 'var(--accent-amber)',
  },
  {
    icon: 'mdi--lightning-bolt-outline',
    title: 'Real-Time Updates',
    description: 'Live market data, instant notifications, and automatic payouts',
    color: 'var(--accent-purple)',
  },
  {
    icon: 'mdi--account-group',
    title: 'Community Driven',
    description: 'Create your own markets, share predictions, and compete on leaderboards',
    color: 'var(--accent-red)',
  },
  {
    icon: 'mdi--palette-outline',
    title: 'Multi-Theme Experience',
    description: '6 professionally designed themes. Switch instantly to match your style',
    color: 'var(--accent-cyan)',
  },
]

export default function KeyFeatures() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
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

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 lg:py-32 relative"
      style={{ background: 'var(--bg-secondary)' }}
      aria-labelledby="key-features-heading"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            id="key-features-heading"
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Why Choose CryptoScore
          </h2>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Experience the future of sports prediction markets
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Feature Card */}
              <div
                className="h-full p-6 md:p-8 rounded-2xl transition-all duration-300 hover-lift"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `2px solid ${hoveredFeature === index ? feature.color : 'var(--border-default)'}`,
                  boxShadow: hoveredFeature === index
                    ? `0 0 30px ${feature.color}40, var(--shadow-2xl)`
                    : 'var(--shadow-lg)',
                }}
              >
                {/* Icon with gradient background */}
                <div className="flex justify-center mb-6">
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: hoveredFeature === index
                        ? `linear-gradient(135deg, ${feature.color}40, ${feature.color}60)`
                        : `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                      transform: hoveredFeature === index ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                    }}
                  >
                    <span
                      className={`icon-[${feature.icon}] w-8 h-8 md:w-10 md:h-10`}
                      style={{ color: feature.color }}
                    />
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="font-display text-xl md:text-2xl font-semibold mb-3 text-center"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm md:text-base text-center leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {feature.description}
                </p>

                {/* Hover glow effect */}
                {hoveredFeature === index && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at center, ${feature.color}10, transparent 70%)`,
                      opacity: 0.5,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
