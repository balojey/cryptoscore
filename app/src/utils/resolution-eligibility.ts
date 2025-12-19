import type { EnhancedMatchData } from '../hooks/useMatchData'

export interface ResolutionEligibility {
  canResolve: boolean
  reason: string
  userHasWinningPrediction: boolean
  matchResult?: 'Home' | 'Draw' | 'Away'
  showResolveButton: boolean
}

export interface ResolutionEligibilityParams {
  matchData: EnhancedMatchData | null
  marketStatus: boolean // true if resolved
  isUserCreator: boolean
  isUserParticipant: boolean
  userPrediction?: 'Home' | 'Draw' | 'Away'
  userAddress?: string
}

/**
 * Determines if a user can resolve a market based on match status and user eligibility
 */
export function determineResolutionEligibility(params: ResolutionEligibilityParams): ResolutionEligibility {
  const {
    matchData,
    marketStatus,
    isUserCreator,
    isUserParticipant,
    userPrediction,
    userAddress
  } = params

  // Default response
  const defaultResponse: ResolutionEligibility = {
    canResolve: false,
    reason: 'Not eligible to resolve',
    userHasWinningPrediction: false,
    showResolveButton: false
  }

  // Check if wallet is connected
  if (!userAddress) {
    return {
      ...defaultResponse,
      reason: 'Wallet not connected'
    }
  }

  // Check if market is already resolved
  if (marketStatus) {
    return {
      ...defaultResponse,
      reason: 'Market already resolved'
    }
  }

  // Check if match data is available
  if (!matchData) {
    return {
      ...defaultResponse,
      reason: 'Match data not available'
    }
  }

  // Check if match has finished
  if (!matchData.isFinished) {
    return {
      ...defaultResponse,
      reason: 'Match has not finished yet'
    }
  }

  // Check if match has valid scores
  if (!matchData.hasValidScore) {
    return {
      ...defaultResponse,
      reason: 'Match scores not available yet'
    }
  }

  // Check if user is authorized (creator or participant)
  if (!isUserCreator && !isUserParticipant) {
    return {
      ...defaultResponse,
      reason: 'Must be market creator or participant to resolve'
    }
  }

  // Determine if user has winning prediction
  const userHasWinningPrediction = userPrediction === matchData.matchResult

  // For participants: only show resolve button if they have a winning prediction
  if (isUserParticipant && !isUserCreator) {
    if (!userHasWinningPrediction) {
      return {
        ...defaultResponse,
        reason: 'No potential rewards to claim',
        userHasWinningPrediction: false,
        matchResult: matchData.matchResult,
        showResolveButton: false
      }
    }
  }

  // User is eligible to resolve
  return {
    canResolve: true,
    reason: 'Eligible to resolve market',
    userHasWinningPrediction,
    matchResult: matchData.matchResult,
    showResolveButton: true
  }
}

/**
 * Gets a user-friendly message for resolution eligibility status
 */
export function getResolutionEligibilityMessage(eligibility: ResolutionEligibility): string {
  if (eligibility.canResolve) {
    return 'You can resolve this market'
  }

  switch (eligibility.reason) {
    case 'Wallet not connected':
      return 'Connect your wallet to resolve markets'
    case 'Market already resolved':
      return 'This market has already been resolved'
    case 'Match has not finished yet':
      return 'Wait for the match to finish'
    case 'Match scores not available yet':
      return 'Match scores are not available yet'
    case 'Must be market creator or participant to resolve':
      return 'Only market creators and participants can resolve markets'
    case 'No potential rewards to claim':
      return 'You have no winning prediction in this market'
    default:
      return eligibility.reason
  }
}