import { useState } from 'react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { shortenAddress } from '../utils/formatters'

interface Comment {
  id: string
  author: string
  text: string
  timestamp: number
  prediction?: 'HOME' | 'DRAW' | 'AWAY'
}

interface MarketCommentsProps {
  marketAddress: string
}

export default function MarketComments({ marketAddress: _marketAddress }: MarketCommentsProps) {
  const { publicKey } = useUnifiedWallet()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedPrediction, setSelectedPrediction] = useState<'HOME' | 'DRAW' | 'AWAY' | undefined>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !publicKey)
      return

    const comment: Comment = {
      id: Date.now().toString(),
      author: publicKey.toBase58(),
      text: newComment.trim(),
      timestamp: Date.now(),
      prediction: selectedPrediction,
    }

    setComments([comment, ...comments])
    setNewComment('')
    setSelectedPrediction(undefined)
  }

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60)
      return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60)
      return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24)
      return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getPredictionBadge = (prediction?: string) => {
    if (!prediction)
      return null

    const variants = {
      HOME: 'default' as const,
      DRAW: 'warning' as const,
      AWAY: 'error' as const,
    }

    const variant = variants[prediction as keyof typeof variants]

    return (
      <Badge variant={variant}>
        {prediction}
      </Badge>
    )
  }

  return (
    <div className="card">
      <h3 className="card-title mb-4">Discussion</h3>

      {/* Comment Form */}
      {publicKey ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-3">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your thoughts or prediction..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
            />
          </div>

          {/* Prediction Tags */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Your prediction:
            </span>
            {(['HOME', 'DRAW', 'AWAY'] as const).map(pred => (
              <Button
                key={pred}
                variant={selectedPrediction === pred ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedPrediction(selectedPrediction === pred ? undefined : pred)}
                className="rounded-full text-xs h-7 px-3"
              >
                {pred}
              </Button>
            ))}
          </div>

          <Button
            variant="default"
            size="sm"
            type="submit"
            disabled={!newComment.trim()}
            className="gap-2"
          >
            <span className="icon-[mdi--send] w-4 h-4" />
            Post Comment
          </Button>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to join the discussion
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0
          ? (
              <div className="text-center py-8">
                <span className="icon-[mdi--comment-outline] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            )
          : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  className="p-4 rounded-lg"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--bg-primary)' }}
                      >
                        <span className="icon-[mdi--account] w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                      <div>
                        <div className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {shortenAddress(comment.author)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {getTimeAgo(comment.timestamp)}
                        </div>
                      </div>
                    </div>
                    {getPredictionBadge(comment.prediction)}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {comment.text}
                  </p>
                </div>
              ))
            )}
      </div>
    </div>
  )
}
