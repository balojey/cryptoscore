import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
      description: '📋',
      duration: 2000,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <span className="icon-[mdi--share-variant] w-4 h-4" />
          <span>Share</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Share this market</DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={shareToTwitter} className="gap-3 cursor-pointer">
          <span className="icon-[mdi--twitter] w-5 h-5" />
          <span>Share on Twitter</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToFarcaster} className="gap-3 cursor-pointer">
          <span className="icon-[mdi--cast] w-5 h-5" />
          <span>Share on Farcaster</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyLink} className="gap-3 cursor-pointer">
          <span className="icon-[mdi--link-variant] w-5 h-5" />
          <span>Copy Link</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
