import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Content from './components/Content'
import Footer from './components/Footer'
import Header from './components/Header'
import ToastProvider from './components/ToastProvider'
import { MarketDetail } from './pages/MarketDetail'
import { MyMarkets } from './pages/MyMarkets'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Content />} />
            <Route path="/my-markets" element={<MyMarkets />} />
            <Route path="/market/:marketAddress" element={<MarketDetail />} />
          </Routes>
        </main>
        <Footer />
        <ToastProvider />
      </div>
    </BrowserRouter>
  )
}

export default App
