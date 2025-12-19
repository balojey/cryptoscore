import { useEffect, useRef, useState } from 'react'

interface HowItWorksStep {
  number: number
  icon: string
  title: string
  description: string
  details: string
  color: string
}

const steps: HowItWorksStep[] = [
  {
    number: 1,
    icon: 'mdi--magnify',
    title: 'Browse Markets',
    description: 'Explore prediction markets for upcoming football matches across major leagues',
    details: 'Filter by league, pool size, or ending time. View real-time odds and participant counts.',
    color: 'var(--accent-cyan)',
  },
  {
    number: 2,
    icon: 'mdi--target',
    title: 'Make Your Prediction',
    description: 'Choose your outcome (HOME/DRAW/AWAY) and stake your entry fee',
    details: 'Join before kickoff. Your stake goes into the pool with transparent distribution.',
    color: 'var(--accent-purple)',
  },
  {
    number: 3,
    icon: 'mdi--trophy-outline',
    title: 'Win Rewards',
    description: 'Correct predictions split the pool. Winners get paid automatically on-chain',
    details: 'Instant payouts after match resolution. Only 5% fee (2% creator, 3% protocol).',
    color: 'var(--accent-green)',
  },
]

export default function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
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
      style={{ background: 'var(--bg-primary)' }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            id="how-it-works-heading"
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            How It Works
          </h2>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Get started in three simple steps
          </p>
        </div>

        {/* Desktop: Horizontal Flow */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Connecting line */}
            <div
              className="absolute top-32 left-0 right-0 h-1 -z-10"
              style={{
                background: `linear-gradient(90deg, ${steps[0].color} 0%, ${steps[1].color} 50%, ${steps[2].color} 100%)`,
                opacity: 0.3,
              }}
            />

            {/* Steps Grid */}
            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                  onMouseEnter={() => setHoveredStep(step.number)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Step Card */}
                  <div
                    className="p-6 md:p-8 rounded-2xl transition-all duration-300 hover-lift relative"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: `2px solid ${hoveredStep === step.number ? step.color : 'var(--border-default)'}`,
                      boxShadow: hoveredStep === step.number ? `0 0 30px ${step.color}40` : 'var(--shadow-lg)',
                    }}
                  >
                    {/* Step Number Badge */}
                    <div
                      className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                      style={{
                        background: step.color,
                        color: 'var(--text-inverse)',
                        boxShadow: `0 4px 12px ${step.color}60`,
                      }}
                    >
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-6 mt-4">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${step.color}20, ${step.color}40)`,
                          transform: hoveredStep === step.number ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        <span
                          className={`icon-[${step.icon}] w-10 h-10`}
                          style={{ color: step.color }}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className="font-display text-xl md:text-2xl font-semibold mb-3 text-center"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-sm md:text-base text-center mb-4"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {step.description}
                    </p>

                    {/* Additional Details (shown on hover) */}
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: hoveredStep === step.number ? '100px' : '0',
                        opacity: hoveredStep === step.number ? 1 : 0,
                      }}
                    >
                      <div
                        className="pt-4 border-t text-sm text-center"
                        style={{
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {step.details}
                      </div>
                    </div>
                  </div>

                  {/* Arrow (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-32 -right-4 transform translate-x-1/2 z-10">
                      <span
                        className="icon-[mdi--arrow-right] w-8 h-8 animate-pulse"
                        style={{ color: step.color }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical Stack */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => (
            <div key={step.number}>
              <div
                className={`relative ${isVisible ? 'animate-slide-in-up' : 'opacity-0'}`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Step Card */}
                <div
                  className="p-6 rounded-2xl transition-all duration-300"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: `2px solid ${step.color}`,
                    boxShadow: `0 0 20px ${step.color}30`,
                  }}
                >
                  {/* Step Number Badge */}
                  <div
                    className="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      background: step.color,
                      color: 'var(--text-inverse)',
                      boxShadow: `0 4px 12px ${step.color}60`,
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mb-4 mt-2">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${step.color}20, ${step.color}40)`,
                      }}
                    >
                      <span
                        className={`icon-[${step.icon}] w-8 h-8`}
                        style={{ color: step.color }}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className="font-display text-xl font-semibold mb-2 text-center"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm text-center mb-3"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {step.description}
                  </p>

                  {/* Details */}
                  <p
                    className="text-xs text-center pt-3 border-t"
                    style={{
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {step.details}
                  </p>
                </div>
              </div>

              {/* Downward Arrow (except for last step) */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-4">
                  <span
                    className="icon-[mdi--arrow-down] w-8 h-8 animate-bounce"
                    style={{ color: step.color }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
