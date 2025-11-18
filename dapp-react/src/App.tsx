import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Content from './components/Content'
import Footer from './components/Footer'
import Header from './components/Header'
import ToastProvider from './components/ToastProvider'

// Lazy load pages for better performance
const MarketDetail = lazy(() => import('./pages/MarketDetail').then(m => ({ default: m.MarketDetail })))
const MyMarkets = lazy(() => import('./pages/MyMarkets').then(m => ({ default: m.MyMarkets })))
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })))

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

function App() {
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
              <Route path="/" element={<Content />} />
              <Route path="/my-markets" element={<MyMarkets />} />
              <Route path="/market/:marketAddress" element={<MarketDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ToastProvider />
      </div>
    </BrowserRouter>
  )
}

export default App
