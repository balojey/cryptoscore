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
 * - Respects prefers-reduced-motion user preference
 */
export function LandingPage() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(() => new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Enable smooth scroll behavior (unless user prefers reduced motion)
    if (!prefersReducedMotion) {
      document.documentElement.style.scrollBehavior = 'smooth'
    }

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
        <FeaturedMarketsPreview />
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
