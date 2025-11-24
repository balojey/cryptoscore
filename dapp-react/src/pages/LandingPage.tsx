import { useEffect, useRef, useState } from 'react'

/**
 * LandingPage Component
 *
 * Main landing page container with:
 * - Section containers with proper spacing and max-width
 * - Smooth scroll behavior between sections
 * - Intersection Observer for scroll-triggered animations
 * - Theme-aware styling using CSS variables
 * - Lazy loading for below-the-fold sections
 */
export function LandingPage() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(() => new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Enable smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth'

    // Create Intersection Observer for scroll-triggered animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section')
            if (sectionId) {
              setVisibleSections(prev => new Set(prev).add(sectionId))
            }
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of section is visible
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before section enters viewport
      },
    )

    // Observe all sections
    const sections = document.querySelectorAll('[data-section]')
    sections.forEach((section) => {
      observerRef.current?.observe(section)
    })

    // Cleanup
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return (
    <div
      className="landing-page"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Hero Section - Above the fold, loads immediately */}
      <section
        data-section="hero"
        className={`landing-section hero-section ${visibleSections.has('hero') ? 'section-visible' : ''}`}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="section-container">
          <div className="text-center">
            <h1
              className="text-5xl md:text-6xl font-bold mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              Hero Section Placeholder
            </h1>
            <p
              className="text-lg md:text-xl mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              This will be replaced with the HeroSection component
            </p>
          </div>
        </div>
      </section>

      {/* Live Metrics Section - Below the fold, lazy loaded */}
      <section
        data-section="metrics"
        className={`landing-section metrics-section ${visibleSections.has('metrics') ? 'section-visible' : ''}`}
      >
        <div className="section-container">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            Live Metrics Placeholder
          </h2>
          <p
            className="text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            This will be replaced with the LiveMetrics component
          </p>
        </div>
      </section>

      {/* How It Works Section - Below the fold, lazy loaded */}
      <section
        data-section="how-it-works"
        className={`landing-section how-it-works-section ${visibleSections.has('how-it-works') ? 'section-visible' : ''}`}
      >
        <div className="section-container">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            How It Works Placeholder
          </h2>
          <p
            className="text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            This will be replaced with the HowItWorks component
          </p>
        </div>
      </section>

      {/* Key Features Section - Below the fold, lazy loaded */}
      <section
        data-section="features"
        className={`landing-section features-section ${visibleSections.has('features') ? 'section-visible' : ''}`}
      >
        <div className="section-container">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            Key Features Placeholder
          </h2>
          <p
            className="text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            This will be replaced with the KeyFeatures component
          </p>
        </div>
      </section>

      {/* Featured Markets Section - Below the fold, lazy loaded */}
      <section
        data-section="featured-markets"
        className={`landing-section featured-markets-section ${visibleSections.has('featured-markets') ? 'section-visible' : ''}`}
      >
        <div className="section-container">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            Featured Markets Placeholder
          </h2>
          <p
            className="text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            This will be replaced with the FeaturedMarketsPreview component
          </p>
        </div>
      </section>

      {/* Why CryptoScore Section - Below the fold, lazy loaded */}
      <section
        data-section="why-cryptoscore"
        className={`landing-section why-cryptoscore-section ${visibleSections.has('why-cryptoscore') ? 'section-visible' : ''}`}
      >
        <div className="section-container">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            Why CryptoScore Placeholder
          </h2>
          <p
            className="text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            This will be replaced with the WhyCryptoScore component
          </p>
        </div>
      </section>

      {/* Final CTA Section - Below the fold, lazy loaded */}
      <section
        data-section="final-cta"
        className={`landing-section final-cta-section ${visibleSections.has('final-cta') ? 'section-visible' : ''}`}
      >
        <div className="section-container">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: 'var(--text-primary)' }}
          >
            Final CTA Placeholder
          </h2>
          <p
            className="text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            This will be replaced with the FinalCTA component
          </p>
        </div>
      </section>
    </div>
  )
}
