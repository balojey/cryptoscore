import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface UserPredictionBadgeProps {
  prediction: 'Home' | 'Draw' | 'Away'
  homeTeam?: string
  awayTeam?: string
  isCorrect?: boolean
  matchResult?: 'Home' | 'Draw' | 'Away'
  isMatchFinished?: boolean
  className?: string
}

/**
 * UserPredictionBadge - Displays user's prediction with visual indicators
 * 
 * Features:
 * - Distinct styling for Home/Draw/Away predictions
 * - Shows correct/incorrect status when match is finished
 * - Accessible with tooltips and proper ARIA labels
 * - Responsive design with consistent styling
 */
export function UserPredictionBadge({
  prediction,
  homeTeam,
  awayTeam,
  isCorrect,
  matchResult,
  isMatchFinished = false,
  className = '',
}: UserPredictionBadgeProps) {
  // Determine badge variant based on prediction type and outcome
  const getBadgeVariant = () => {
    if (isMatchFinished && isCorrect !== undefined) {
      return isCorrect ? 'success' : 'error'
    }
    
    // Default variants for different prediction types
    switch (prediction) {
      case 'Home':
        return 'info' as const
      case 'Draw':
        return 'warning' as const
      case 'Away':
        return 'neutral' as const
      default:
        return 'neutral' as const
    }
  }

  // Get display text for prediction
  const getPredictionText = () => {
    switch (prediction) {
      case 'Home':
        return homeTeam ? `${homeTeam} Win` : 'Home Win'
      case 'Draw':
        return 'Draw'
      case 'Away':
        return awayTeam ? `${awayTeam} Win` : 'Away Win'
      default:
        return prediction
    }
  }

  // Get icon for prediction type
  const getPredictionIcon = () => {
    if (isMatchFinished && isCorrect !== undefined) {
      return isCorrect 
        ? 'icon-[mdi--check-circle]' 
        : 'icon-[mdi--close-circle]'
    }

    switch (prediction) {
      case 'Home':
        return 'icon-[mdi--home]'
      case 'Draw':
        return 'icon-[mdi--equal]'
      case 'Away':
        return 'icon-[mdi--airplane-takeoff]'
      default:
        return 'icon-[mdi--help-circle]'
    }
  }

  // Get tooltip content
  const getTooltipContent = () => {
    const predictionText = getPredictionText()
    
    if (isMatchFinished && matchResult) {
      const resultText = matchResult === 'Home' 
        ? `${homeTeam || 'Home'} won`
        : matchResult === 'Away'
        ? `${awayTeam || 'Away'} won`
        : 'Match ended in a draw'
      
      return (
        <div className="text-center">
          <p className="font-medium">Your prediction: {predictionText}</p>
          <p className="text-xs mt-1">Result: {resultText}</p>
          <p className={`text-xs mt-1 font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? '✓ Correct prediction!' : '✗ Incorrect prediction'}
          </p>
        </div>
      )
    }
    
    return `Your prediction: ${predictionText}`
  }

  const badgeVariant = getBadgeVariant()
  const predictionText = getPredictionText()
  const iconClass = getPredictionIcon()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={badgeVariant}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
            transition-all duration-200 hover:scale-105
            ${className}
          `}
          aria-label={`Your prediction: ${predictionText}${isMatchFinished && isCorrect !== undefined ? ` - ${isCorrect ? 'Correct' : 'Incorrect'}` : ''}`}
        >
          <span className={`${iconClass} w-3.5 h-3.5 flex-shrink-0`} />
          <span className="truncate max-w-[120px]">
            {predictionText}
          </span>
          {isMatchFinished && isCorrect !== undefined && (
            <span className={`
              w-2 h-2 rounded-full flex-shrink-0
              ${isCorrect ? 'bg-green-400' : 'bg-red-400'}
            `} />
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  )
}

export default UserPredictionBadge