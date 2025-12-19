import { useMemo } from 'react'
import type { EnhancedMatchData } from './useMatchData'
import { determineResolutionEligibility, type ResolutionEligibility } from '../utils/resolution-eligibility'

export interface UseResolutionEligibilityParams {
  matchData: EnhancedMatchData | null
  marketStatus: boolean
  isUserCreator: boolean
  isUserParticipant: boolean
  userPrediction?: 'Home' | 'Draw' | 'Away'
  userAddress?: string
}

/**
 * Hook to determine if user can resolve a market and manage resolution eligibility state
 */
export function useResolutionEligibility(params: UseResolutionEligibilityParams): ResolutionEligibility {
  return useMemo(() => {
    return determineResolutionEligibility(params)
  }, [
    params.matchData?.id,
    params.matchData?.status,
    params.matchData?.isFinished,
    params.matchData?.hasValidScore,
    params.matchData?.matchResult,
    params.marketStatus,
    params.isUserCreator,
    params.isUserParticipant,
    params.userPrediction,
    params.userAddress
  ])
}