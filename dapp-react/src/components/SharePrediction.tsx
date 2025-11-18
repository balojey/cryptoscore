import { useState } from 'react'
import toast from 'react-hot-toast'

interface SharePredictionProps {
  marketAddress: string
  matchInfo: {
    homeTeam: string
    awayTeam: string
    competition: string
  }
  prediction?: 'HOME' | 'DRAW' | 'AWAY'
}

export default function SharePrediction({ marketAddress, matchInfo, prediction }: SharePredictionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const shareUrl = `${window.location.origin}/market/${marketAddress}`
  
  const getShareText = () => {
    const predictionText = prediction 
      ? `I'm predicting ${prediction === 'HOME' ? matchInfo.homeTeam : prediction === 'AWAY' ? matchInfo.awayTeam : 'a DRAW'} to win!`
      : `Check out this prediction market!`
    
    return `${predictionText}\n\n${matchInfo.homeTeam} vs ${matchInfo.awayTeam}\n${matchInfo.competition}\n\n`
  }

  const shareToTwitter = () => {
    const text = getShareText()
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  const shareToFarcaster = () => {
    const text = getShareText()
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text + shareUrl)}`
    window.open(farcasterUrl, '_blank', 'width=550,height=600')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!', {
      icon: '📋',
      duration: 2000,
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary btn-sm"
      >
        <span className="icon-[mdi--share-variant] w-4 h-4" />
        <span>Share</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl z-50 p-2"
            style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-default)' 
            }}
          >
            <div className="mb-3 px-2 py-1">
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Share this market
              </p>
            </div>

            <button
              type="button"
              onClick={shareToTwitter}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = '#1DA1F2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span className="icon-[mdi--twitter] w-5 h-5" />
              <span>Share on Twitter</span>
            </button>

            <button
              type="button"
              onClick={shareToFarcaster}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = '#8A63D2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span className="icon-[mdi--cast] w-5 h-5" />
              <span>Share on Farcaster</span>
            </button>

            <div className="my-2 border-t" style={{ borderColor: 'var(--border-default)' }} />

            <button
              type="button"
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--accent-cyan)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span className="icon-[mdi--link-variant] w-5 h-5" />
              <span>Copy Link</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
