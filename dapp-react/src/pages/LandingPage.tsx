import { useEffect, useRef, useState } from 'react'
import HeroSection from '../components/landing/HeroSection'
import LiveMetrics from '../components/landing/LiveMetrics'
import HowItWorks from '../components/landing/HowItWorks'
import KeyFeatures from '../components/landing/KeyFeatures'
import FeaturedMarketsPreview from '../components/landing/FeaturedMarketsPreview'
import WhyCryptoScore from '../components/landing/WhyCryptoScore'
import FinalCTA from '../components/landing/FinalCTA'

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
      <HeroSection />

      {/* Live Metrics Section - Below the fold, lazy loaded */}
      <section
        data-section="metrics"
        className={`landing-section metrics-section ${visibleSections.has('metrics') ? 'section-visible' : ''}`}
      >
        <LiveMetrics />
      </section>

      {/* How It Works Section - Below the fold, lazy loaded */}
      <HowItWorks />

      {/* Key Features Section - Below the fold, lazy loaded */}
      <KeyFeatures />

      {/* Featured Markets Section - Below the fold, lazy loaded */}
      <section
        data-section="featured-markets"
        className={`landing-section featured-markets-section ${visibleSections.has('featured-markets') ? 'section-visible' : ''}`}
      >
        <FeaturedMarketsPreview />
      </section>

      {/* Why CryptoScore Section - Below the fold, lazy loaded */}
      <WhyCryptoScore />

      {/* Final CTA Section - Below the fold, lazy loaded */}
      <FinalCTA />
    </div>
  )
}
