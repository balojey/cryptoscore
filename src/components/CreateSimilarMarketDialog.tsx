import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMnee } from '@/hooks/useMnee'

import type { EnhancedMatchData } from '@/hooks/useMatchData'

export interface CreateSimilarMarketParams {
  matchId: string
  title: string
  description: string
  entryFee: number
  isPublic: boolean
}

interface CreateSimilarMarketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchData: EnhancedMatchData
  onCreateMarket: (params: CreateSimilarMarketParams) => Promise<void>
  isLoading?: boolean
}

export function CreateSimilarMarketDialog({
  open,
  onOpenChange,
  matchData,
  onCreateMarket,
  isLoading = false,
}: CreateSimilarMarketDialogProps) {
  const { formatAmount, toAtomicUnits } = useMnee()
  const [entryFee, setEntryFee] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [errors, setErrors] = useState<{ entryFee?: string }>({})

  // Force SOL currency for Create Similar Market dialog - no currency selection allowed

  // MNEE-only validation
  const validateEntryFee = (value: string): string | undefined => {
    const numValue = parseFloat(value)
    if (!value || isNaN(numValue)) {
      return 'Entry fee is required'
    }
    if (numValue <= 0) {
      return 'Entry fee must be greater than 0'
    }
    // MNEE minimum validation - minimum 0.00001 MNEE
    if (numValue < 0.00001) {
      return 'Minimum entry fee is 0.00001 MNEE'
    }
    return undefined
  }

  const handleEntryFeeChange = (value: string) => {
    setEntryFee(value)
    const error = validateEntryFee(value)
    setErrors(prev => ({ ...prev, entryFee: error }))
  }

  const handleSubmit = async () => {
    const entryFeeError = validateEntryFee(entryFee)
    
    if (entryFeeError) {
      setErrors({ entryFee: entryFeeError })
      return
    }

    // Convert entry fee to atomic units - MNEE only
    const entryFeeValue = parseFloat(entryFee)
    const entryFeeInAtomic = toAtomicUnits(entryFeeValue)

    // Generate title and description based on match data
    const title = `${matchData.homeTeam.name} vs ${matchData.awayTeam.name}`
    const description = `Prediction market for ${matchData.homeTeam.name} vs ${matchData.awayTeam.name} - ${matchData.competition.name}`

    try {
      await onCreateMarket({
        matchId: matchData.id.toString(),
        title,
        description,
        entryFee: entryFeeInAtomic,
        isPublic: visibility === 'public',
      })
      
      // Reset form and close dialog on success
      setEntryFee('')
      setVisibility('public')
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Failed to create similar market:', error)
    }
  }

  const isFormValid = entryFee && !errors.entryFee && !isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Similar Market</DialogTitle>
          <DialogDescription>
            Create a new market for the same match with different parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Information */}
          <div className="space-y-2">
            <h4 className="font-sans text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Match Details
            </h4>
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                background: 'var(--bg-secondary)', 
                borderColor: 'var(--border-default)' 
              }}
            >
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-primary)' }}>
                  {matchData.homeTeam.name} vs {matchData.awayTeam.name}
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {matchData.competition.name} • {new Date(matchData.utcDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Entry Fee - MNEE Only */}
          <div className="space-y-2">
            <label className="font-sans text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Entry Fee
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter amount in MNEE"
                value={entryFee}
                onChange={(e) => handleEntryFeeChange(e.target.value)}
                step="0.00001"
                min="0.00001"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  MNEE
                </span>
              </div>
            </div>
            {errors.entryFee && (
              <p className="text-xs" style={{ color: 'var(--error)' }}>
                {errors.entryFee}
              </p>
            )}
            )}
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Entry fees are processed in SOL only for similar markets
            </p>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="font-sans text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Market Visibility
            </label>
            <Select value={visibility} onValueChange={(value: 'public' | 'private') => setVisibility(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <span className="icon-[mdi--earth] w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                    <div>
                      <div>Public</div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Anyone can join this market
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <span className="icon-[mdi--lock] w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
                    <div>
                      <div>Private</div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Only you can see this market
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <span className="icon-[mdi--loading] w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <span className="icon-[mdi--plus] w-4 h-4" />
                Create Market
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}