import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

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
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <span className="icon-[mdi--share-variant] w-4 h-4" />
        <span>Share</span>
      </Button>

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
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="mb-3 px-2 py-1">
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Share this market
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={shareToTwitter}
              className="w-full justify-start gap-3"
            >
              <span className="icon-[mdi--twitter] w-5 h-5" />
              <span>Share on Twitter</span>
            </Button>

            <Button
              variant="ghost"
              onClick={shareToFarcaster}
              className="w-full justify-start gap-3"
            >
              <span className="icon-[mdi--cast] w-5 h-5" />
              <span>Share on Farcaster</span>
            </Button>

            <div className="my-2 border-t" style={{ borderColor: 'var(--border-default)' }} />

            <Button
              variant="ghost"
              onClick={copyLink}
              className="w-full justify-start gap-3"
            >
              <span className="icon-[mdi--link-variant] w-5 h-5" />
              <span>Copy Link</span>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
