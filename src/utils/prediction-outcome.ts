import type { EnhancedMatchData } from '../hooks/useMatchData'

export interface PredictionOutcome {
  isCorrect: boolean | undefined
  matchResult?: 'Home' | 'Draw' | 'Away'
  canDetermineOutcome: boolean
  outcomeMessage: string
}

/**
 * Determines the outcome of a user's prediction based on match results
 */
export function determinePredictionOutcome(
  userPrediction: 'Home' | 'Draw' | 'Away',
  matchData: EnhancedMatchData | null
): PredictionOutcome {
  // Default response when outcome cannot be determined
  const defaultResponse: PredictionOutcome = {
    isCorrect: undefined,
    canDetermineOutcome: false,
    outcomeMessage: 'Match result pending'
  }

  // Check if match data is available
  if (!matchData) {
    return {
      ...defaultResponse,
      outcomeMessage: 'Match data not available'
    }
  }

  // Check if match has finished
  if (!matchData.isFinished) {
    return {
      ...defaultResponse,
      outcomeMessage: 'Match in progress'
    }
  }

  // Check if match has valid scores
  if (!matchData.hasValidScore || !matchData.matchResult) {
    return {
      ...defaultResponse,
      outcomeMessage: 'Match scores not available'
    }
  }

  // Determine if prediction is correct
  const isCorrect = userPrediction === matchData.matchResult
  
  return {
    isCorrect,
    matchResult: matchData.matchResult,
    canDetermineOutcome: true,
    outcomeMessage: isCorrect ? 'Correct prediction!' : 'Incorrect prediction'
  }
}

/**
 * Gets a user-friendly message for prediction outcome
 */
export function getPredictionOutcomeMessage(
  userPrediction: 'Home' | 'Draw' | 'Away',
  outcome: PredictionOutcome,
  homeTeam?: string,
  awayTeam?: string
): string {
  if (!outcome.canDetermineOutcome) {
    return outcome.outcomeMessage
  }

  const predictionText = formatPredictionText(userPrediction, homeTeam, awayTeam)
  const resultText = formatPredictionText(outcome.matchResult!, homeTeam, awayTeam)
  
  if (outcome.isCorrect) {
    return `✓ Correct! You predicted ${predictionText}`
  } else {
    return `✗ Incorrect. You predicted ${predictionText}, but the result was ${resultText}`
  }
}

/**
 * Formats prediction text with team names
 */
function formatPredictionText(
  prediction: 'Home' | 'Draw' | 'Away',
  homeTeam?: string,
  awayTeam?: string
): string {
  switch (prediction) {
    case 'Home':
      return homeTeam ? `${homeTeam} win` : 'Home win'
    case 'Draw':
      return 'Draw'
    case 'Away':
      return awayTeam ? `${awayTeam} win` : 'Away win'
    default:
      return prediction
  }
}

/**
 * Gets visual indicator class for prediction outcome
 */
export function getPredictionOutcomeClass(outcome: PredictionOutcome): string {
  if (!outcome.canDetermineOutcome) {
    return 'text-gray-500'
  }
  
  return outcome.isCorrect ? 'text-green-500' : 'text-red-500'
}