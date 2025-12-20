import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Content from './components/Content'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'
import ToastProvider from './components/ui/ToastProvider'
import { TooltipProvider } from './components/ui/tooltip'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useScrollLockCleanup } from './hooks/useScrollLockCleanup'

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const TradingTerminal = lazy(() => import('./pages/TradingTerminal').then(m => ({ default: m.TradingTerminal })))
const MarketDetail = lazy(() => import('./pages/MarketDetail').then(m => ({ default: m.MarketDetail })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })))
const ShadcnTest = lazy(() => import('./pages/ShadcnTest'))

// Loading fallback component
function PageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
          style={{
            borderColor: 'var(--border-default)',
            borderTopColor: 'var(--accent-cyan)',
          }}
        />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Loading...
        </p>
      </div>
    </div>
  )
}

// Inner component that can access CurrencyContext
function AppContent() {
  // Prevent body scroll lock issues with modals
  useScrollLockCleanup()

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <Header />

        <main id="main-content" className="flex-grow" role="main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/markets" element={<Content />} />
              <Route path="/terminal" element={<TradingTerminal />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/markets/:marketId" element={<MarketDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/shadcn-test" element={<ShadcnTest />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ToastProvider />
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

export default App
