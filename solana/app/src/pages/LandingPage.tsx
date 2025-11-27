import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import FinalCTA from '../components/landing/FinalCTA'
import HeroSection from '../components/landing/HeroSection'
import HowItWorks from '../components/landing/HowItWorks'
import KeyFeatures from '../components/landing/KeyFeatures'
import LiveMetrics from '../components/landing/LiveMetrics'
import WhyCryptoScore from '../components/landing/WhyCryptoScore'

// Lazy load FeaturedMarketsPreview (below the fold)
const FeaturedMarketsPreview = lazy(() => import('../components/landing/FeaturedMarketsPreview'))

/**
 * LandingPage Component
 *
 * Main landing page container with:
 * - Section containers with proper spacing and max-width
 * - Smooth scroll behavior between sections
 * - Intersection Observer for scroll-triggered animations
 * - Theme-aware styling using CSS variables
 * - Lazy loading for below-the-fold sections
 * - Respects prefers-reduced-motion user preference
 */
export function LandingPage() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(() => new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Enable smooth scroll behavior (unless user prefers reduced motion)
    if (!prefersReducedMotion) {
      document.documentElement.style.scrollBehavior = 'smooth'
    }

    // Create Intersection Observer for scroll-triggered animations with debouncing
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Debounce the visibility updates to avoid excessive re-renders
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId = entry.target.getAttribute('data-section')
              if (sectionId) {
                setVisibleSections(prev => new Set(prev).add(sectionId))
              }
            }
          })
        }, 100) // 100ms debounce
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

    // Handle smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')

      if (anchor && !prefersReducedMotion) {
        const href = anchor.getAttribute('href')
        if (href && href.startsWith('#')) {
          e.preventDefault()
          const targetElement = document.querySelector(href)
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)

    // Cleanup
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
      document.removeEventListener('click', handleAnchorClick)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
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
      <section id="hero" data-section="hero">
        <HeroSection />
      </section>

      {/* Live Metrics Section - Below the fold, lazy loaded */}
      <section
        id="metrics"
        data-section="metrics"
        className={`landing-section metrics-section transition-opacity duration-700 ${
          visibleSections.has('metrics') ? 'opacity-100 animate-fade-in' : 'opacity-0'
        }`}
      >
        <LiveMetrics />
      </section>

      {/* How It Works Section - Below the fold, lazy loaded */}
      <section
        id="how-it-works"
        data-section="how-it-works"
        className={`landing-section transition-opacity duration-700 ${
          visibleSections.has('how-it-works') ? 'opacity-100 animate-fade-in' : 'opacity-0'
        }`}
      >
        <HowItWorks />
      </section>

      {/* Key Features Section - Below the fold, lazy loaded */}
      <section
        id="features"
        data-section="features"
        className={`landing-section transition-opacity duration-700 ${
          visibleSections.has('features') ? 'opacity-100 animate-fade-in' : 'opacity-0'
        }`}
      >
        <KeyFeatures />
      </section>

      {/* Featured Markets Section - Below the fold, lazy loaded */}
      <section
        id="featured-markets"
        data-section="featured-markets"
        className={`landing-section featured-markets-section transition-opacity duration-700 ${
          visibleSections.has('featured-markets') ? 'opacity-100 animate-fade-in' : 'opacity-0'
        }`}
      >
        <Suspense
          fallback={(
            <div className="py-16 md:py-24">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <div className="skeleton h-10 w-64 mx-auto mb-4 rounded-lg" />
                  <div className="skeleton h-6 w-96 mx-auto rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array.from({ length: 3 })].map((_, i) => (
                    <div key={i} className="skeleton h-64 rounded-[16px]" />
                  ))}
                </div>
              </div>
            </div>
          )}
        >
          <FeaturedMarketsPreview />
        </Suspense>
      </section>

      {/* Why CryptoScore Section - Below the fold, lazy loaded */}
      <section
        id="why-cryptoscore"
        data-section="why-cryptoscore"
        className={`landing-section transition-opacity duration-700 ${
          visibleSections.has('why-cryptoscore') ? 'opacity-100 animate-fade-in' : 'opacity-0'
        }`}
      >
        <WhyCryptoScore />
      </section>

      {/* Final CTA Section - Below the fold, lazy loaded */}
      <section
        id="final-cta"
        data-section="final-cta"
        className={`landing-section transition-opacity duration-700 ${
          visibleSections.has('final-cta') ? 'opacity-100 animate-fade-in' : 'opacity-0'
        }`}
      >
        <FinalCTA />
      </section>
    </div>
  )
}
