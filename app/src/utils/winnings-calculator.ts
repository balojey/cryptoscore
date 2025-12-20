/**
 * WinningsCalculator - Core utility for calculating winnings in prediction markets
 * 
 * Handles all winnings calculations based on user authentication status, participation,
 * market state, and fee distribution rules.
 */

import type { MarketData } from '../hooks/useMarketData'
import type { ParticipantData } from '../hooks/useParticipantData'
import type { EnhancedMatchData } from '../hooks/useMatchData'
import { FEE_DISTRIBUTION, BASIS_POINTS_DIVISOR } from '../config/fees'

/**
 * Parameters for winnings calculation
 */
export interface WinningsCalculationParams {
  marketData: MarketData
  participantData?: ParticipantData | null
  userAddress?: string
  matchData?: EnhancedMatchData | null
}

/**
 * Result of winnings calculation
 */
export interface WinningsResult {
  type: 'potential' | 'actual' | 'creator_reward' | 'none'
  amount: number // in decimal format
  breakdown?: {
    participantWinnings?: number
    creatorReward?: number
    totalPool?: number
    winnerCount?: number
  }
  status: 'eligible' | 'won' | 'lost' | 'distributed' | 'pending'
  message: string
  displayVariant: 'success' | 'warning' | 'info' | 'error'
  icon: string
}

/**
 * Market display state enum for different user scenarios
 */
export enum MarketDisplayState {
  OPEN_UNAUTHENTICATED = 'open_unauthenticated',
  OPEN_AUTHENTICATED_NON_PARTICIPANT = 'open_authenticated_non_participant',
  OPEN_PARTICIPANT = 'open_participant',
  OPEN_CREATOR_PARTICIPANT = 'open_creator_participant',
  OPEN_CREATOR_NON_PARTICIPANT = 'open_creator_non_participant',
  ENDED_PARTICIPANT_WINNER = 'ended_participant_winner',
  ENDED_PARTICIPANT_LOSER = 'ended_participant_loser',
  ENDED_CREATOR_PARTICIPANT = 'ended_creator_participant',
  ENDED_CREATOR_NON_PARTICIPANT = 'ended_creator_non_participant',
  RESOLVED_PARTICIPANT_WINNER = 'resolved_participant_winner',
  RESOLVED_PARTICIPANT_LOSER = 'resolved_participant_loser',
  RESOLVED_CREATOR = 'resolved_creator'
}

/**
 * Core winnings calculator class
 */
export class WinningsCalculator {
  /**
   * Main entry point for calculating winnings based on all parameters
   */
  static calculateWinnings(params: WinningsCalculationParams): WinningsResult {
    const { marketData, participantData, userAddress, matchData } = params

    // Determine market display state
    const displayState = this.determineMarketDisplayState(marketData, participantData, userAddress, matchData)

    // Calculate winnings based on state
    switch (displayState) {
      case MarketDisplayState.OPEN_UNAUTHENTICATED:
      case MarketDisplayState.OPEN_AUTHENTICATED_NON_PARTICIPANT:
        return this.calculatePotentialWinningsForNonParticipant(marketData)

      case MarketDisplayState.OPEN_PARTICIPANT:
        return this.calculatePotentialWinningsForParticipant(marketData, participantData!)

      case MarketDisplayState.OPEN_CREATOR_PARTICIPANT:
        return this.calculatePotentialWinningsForCreatorParticipant(marketData, participantData!)

      case MarketDisplayState.OPEN_CREATOR_NON_PARTICIPANT:
        return this.calculatePotentialCreatorReward(marketData)

      case MarketDisplayState.ENDED_PARTICIPANT_WINNER:
        return this.calculateActualWinningsForWinner(marketData, participantData!, matchData!)

      case MarketDisplayState.ENDED_PARTICIPANT_LOSER:
        return this.calculateLossForParticipant(marketData, participantData!)

      case MarketDisplayState.ENDED_CREATOR_PARTICIPANT:
        return this.calculateEndedCreatorParticipantWinnings(marketData, participantData!, matchData!)

      case MarketDisplayState.ENDED_CREATOR_NON_PARTICIPANT:
        return this.calculateEndedCreatorReward(marketData)

      case MarketDisplayState.RESOLVED_PARTICIPANT_WINNER:
        return this.calculateResolvedParticipantWinnings(marketData, participantData!)

      case MarketDisplayState.RESOLVED_PARTICIPANT_LOSER:
        return this.calculateResolvedParticipantLoss(marketData, participantData!)

      case MarketDisplayState.RESOLVED_CREATOR:
        return this.calculateResolvedCreatorReward(marketData)

      default:
        return this.createNoWinningsResult()
    }
  }

  /**
   * Calculate potential winnings for a specific prediction
   * @param marketData - Market data
   * @param prediction - Prediction type
   * @param isExistingParticipant - Whether this is for an existing participant (default: false)
   */
  static calculatePotentialWinnings(
    marketData: MarketData, 
    prediction?: 'Home' | 'Draw' | 'Away',
    isExistingParticipant: boolean = false
  ): number {
    if (!prediction || marketData.participantCount === 0) {
      return marketData.entryFee
    }

    // Get count for the specific prediction
    const predictionCount = this.getPredictionCount(marketData, prediction)
    
    if (isExistingParticipant) {
      // For existing participants, use current pool and current prediction count
      const currentParticipantPool = this.calculateParticipantPool(marketData.totalPool)
      
      if (predictionCount === 0) {
        // This shouldn't happen for existing participants, but handle gracefully
        return currentParticipantPool
      }
      
      return Math.floor(currentParticipantPool / predictionCount)
    } else {
      // For new users, calculate what happens if they join
      const newTotalPool = marketData.totalPool + marketData.entryFee
      const newParticipantPool = this.calculateParticipantPool(newTotalPool)
      
      // If no one has made this prediction yet, user gets the full participant pool
      if (predictionCount === 0) {
        return newParticipantPool
      }

      // Calculate winnings per winner after this user joins (they'll be one of the winners)
      const newPredictionCount = predictionCount + 1
      return Math.floor(newParticipantPool / newPredictionCount)
    }
  }

  /**
   * Calculate average potential winnings across all three predictions for non-participants
   * This gives users a better understanding of expected returns regardless of which prediction they choose
   * @param marketData - Market data
   * @returns Object with average winnings and breakdown by prediction
   */
  static calculateAveragePotentialWinnings(marketData: MarketData): {
    average: number
    breakdown: {
      Home: number
      Draw: number
      Away: number
    }
    explanation: string
  } {
    if (marketData.participantCount === 0) {
      return {
        average: marketData.entryFee,
        breakdown: {
          Home: marketData.entryFee,
          Draw: marketData.entryFee,
          Away: marketData.entryFee
        },
        explanation: "No participants yet - you'd get the full participant pool (95% of total) for any prediction"
      }
    }

    // Calculate potential winnings for each prediction
    const homeWinnings = this.calculatePotentialWinnings(marketData, 'Home', false)
    const drawWinnings = this.calculatePotentialWinnings(marketData, 'Draw', false)
    const awayWinnings = this.calculatePotentialWinnings(marketData, 'Away', false)

    const average = Math.floor((homeWinnings + drawWinnings + awayWinnings) / 3)

    // Generate explanation based on current market state
    const newTotalPool = marketData.totalPool + marketData.entryFee
    const newParticipantPool = this.calculateParticipantPool(newTotalPool)
    
    const explanation = `Average of potential winnings across all predictions. ` +
      `Total pool after you join: ${(newTotalPool / 1e9).toFixed(3)} SOL. ` +
      `Participant pool (95%): ${(newParticipantPool / 1e9).toFixed(3)} SOL. ` +
      `Your winnings depend on how many others chose the same prediction.`

    return {
      average,
      breakdown: {
        Home: homeWinnings,
        Draw: drawWinnings,
        Away: awayWinnings
      },
      explanation
    }
  }

  /**
   * Calculate actual winnings for a participant with correct prediction
   */
  static calculateActualWinnings(
    marketData: MarketData, 
    participantData: ParticipantData
  ): number {
    if (!marketData.outcome || marketData.outcome !== participantData.prediction) {
      return 0
    }

    const participantPool = this.calculateParticipantPool(marketData.totalPool)
    const winnerCount = this.getPredictionCount(marketData, marketData.outcome)
    
    if (winnerCount === 0) {
      return 0
    }

    return Math.floor(participantPool / winnerCount)
  }

  /**
   * Calculate creator reward (2% of total pool)
   */
  static calculateCreatorReward(marketData: MarketData): number {
    return Math.floor((marketData.totalPool * FEE_DISTRIBUTION.CREATOR_FEE_BPS) / BASIS_POINTS_DIVISOR)
  }

  /**
   * Check if user is the market creator
   */
  static isUserCreator(marketData: MarketData, userAddress?: string): boolean {
    return !!userAddress && marketData.creator.toLowerCase() === userAddress.toLowerCase()
  }

  /**
   * Check if user is a participant in the market
   */
  static isUserParticipant(participantData?: ParticipantData | null): boolean {
    return !!participantData
  }

  /**
   * Validate market data structure and values
   */
  static validateMarketData(marketData: MarketData): boolean {
    try {
      // Check required fields exist
      if (!marketData || typeof marketData !== 'object') {
        return false
      }

      // Validate numeric fields
      const numericFields = ['entryFee', 'totalPool', 'participantCount', 'homeCount', 'drawCount', 'awayCount']
      for (const field of numericFields) {
        const value = (marketData as any)[field]
        if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
          console.warn(`[WinningsCalculator] Invalid ${field}:`, value)
          return false
        }
      }

      // Validate string fields
      if (!marketData.status || !marketData.creator) {
        return false
      }

      // Validate status enum
      const validStatuses = ['Open', 'Live', 'Resolved', 'Cancelled']
      if (!validStatuses.includes(marketData.status)) {
        return false
      }

      // Validate participant counts match total
      const calculatedTotal = marketData.homeCount + marketData.drawCount + marketData.awayCount
      if (calculatedTotal !== marketData.participantCount) {
        console.warn('[WinningsCalculator] Participant count mismatch:', {
          calculated: calculatedTotal,
          reported: marketData.participantCount,
        })
        // Allow small discrepancies due to race conditions
        if (Math.abs(calculatedTotal - marketData.participantCount) > 1) {
          return false
        }
      }

      // Validate pool consistency
      const expectedPool = marketData.entryFee * marketData.participantCount
      if (Math.abs(marketData.totalPool - expectedPool) > marketData.entryFee) {
        console.warn('[WinningsCalculator] Pool amount inconsistency:', {
          expected: expectedPool,
          actual: marketData.totalPool,
        })
        // Allow for small rounding differences
        return false
      }

      return true
    } catch (error) {
      console.error('[WinningsCalculator] Validation error:', error)
      return false
    }
  }

  /**
   * Create a fallback result when calculation fails
   */
  static createFallbackResult(marketData: MarketData, error: Error): WinningsResult {
    // Determine appropriate fallback based on error type
    if (error.message.includes('Invalid market data')) {
      return {
        type: 'none',
        amount: 0,
        status: 'eligible',
        message: 'Market data is invalid or corrupted',
        displayVariant: 'error',
        icon: 'AlertTriangle',
      }
    }

    if (error.message.includes('exchange rate') || error.message.includes('currency')) {
      return {
        type: 'potential',
        amount: marketData.entryFee, // Fallback to entry fee as basic estimate
        status: 'eligible',
        message: 'Currency conversion unavailable - showing SOL estimate',
        displayVariant: 'warning',
        icon: 'AlertTriangle',
      }
    }

    // Generic calculation error
    return {
      type: 'none',
      amount: 0,
      status: 'eligible',
      message: 'Unable to calculate winnings - please try again',
      displayVariant: 'error',
      icon: 'AlertTriangle',
    }
  }

  /**
   * Create a safe calculation result with error boundaries
   */
  static safeCalculateWinnings(params: WinningsCalculationParams): WinningsResult {
    try {
      // Validate inputs first
      if (!this.validateMarketData(params.marketData)) {
        throw new Error('Invalid market data structure')
      }

      // Perform calculation with additional safety checks
      return this.calculateWinnings(params)
    } catch (error) {
      console.error('[WinningsCalculator] Safe calculation failed:', error)
      return this.createFallbackResult(params.marketData, error as Error)
    }
  }

  /**
   * Determine the market display state based on all parameters
   */
  private static determineMarketDisplayState(
    marketData: MarketData,
    participantData?: ParticipantData | null,
    userAddress?: string,
    matchData?: EnhancedMatchData | null
  ): MarketDisplayState {
    const isCreator = this.isUserCreator(marketData, userAddress)
    const isParticipant = this.isUserParticipant(participantData)
    const isAuthenticated = !!userAddress

    // Open market states
    if (marketData.status === 'Open') {
      if (!isAuthenticated) {
        return MarketDisplayState.OPEN_UNAUTHENTICATED
      }
      
      if (isCreator && isParticipant) {
        return MarketDisplayState.OPEN_CREATOR_PARTICIPANT
      }
      
      if (isCreator && !isParticipant) {
        return MarketDisplayState.OPEN_CREATOR_NON_PARTICIPANT
      }
      
      if (isParticipant) {
        return MarketDisplayState.OPEN_PARTICIPANT
      }
      
      return MarketDisplayState.OPEN_AUTHENTICATED_NON_PARTICIPANT
    }

    // Ended market states (match finished but not resolved)
    if (marketData.status === 'Live' && matchData?.isFinished) {
      const isWinner = isParticipant && 
        matchData.matchResult && 
        participantData?.prediction === matchData.matchResult

      if (isCreator && isParticipant) {
        return MarketDisplayState.ENDED_CREATOR_PARTICIPANT
      }
      
      if (isCreator && !isParticipant) {
        return MarketDisplayState.ENDED_CREATOR_NON_PARTICIPANT
      }
      
      if (isParticipant && isWinner) {
        return MarketDisplayState.ENDED_PARTICIPANT_WINNER
      }
      
      if (isParticipant && !isWinner) {
        return MarketDisplayState.ENDED_PARTICIPANT_LOSER
      }
    }

    // Resolved market states
    if (marketData.status === 'Resolved') {
      const isWinner = isParticipant && 
        marketData.outcome && 
        participantData?.prediction === marketData.outcome

      if (isCreator) {
        return MarketDisplayState.RESOLVED_CREATOR
      }
      
      if (isParticipant && isWinner) {
        return MarketDisplayState.RESOLVED_PARTICIPANT_WINNER
      }
      
      if (isParticipant && !isWinner) {
        return MarketDisplayState.RESOLVED_PARTICIPANT_LOSER
      }
    }

    // Default fallback
    return MarketDisplayState.OPEN_UNAUTHENTICATED
  }

  /**
   * Calculate participant pool (95% of total pool after fees)
   */
  private static calculateParticipantPool(totalPool: number): number {
    return Math.floor((totalPool * FEE_DISTRIBUTION.PARTICIPANT_POOL_BPS) / BASIS_POINTS_DIVISOR)
  }

  /**
   * Get prediction count for a specific outcome
   */
  private static getPredictionCount(marketData: MarketData, prediction: 'Home' | 'Draw' | 'Away'): number {
    switch (prediction) {
      case 'Home': return marketData.homeCount
      case 'Draw': return marketData.drawCount
      case 'Away': return marketData.awayCount
      default: return 0
    }
  }

  // Individual calculation methods for each state

  private static calculatePotentialWinningsForNonParticipant(marketData: MarketData): WinningsResult {
    const averageWinnings = this.calculateAveragePotentialWinnings(marketData)
    
    return {
      type: 'potential',
      amount: averageWinnings.average,
      breakdown: {
        participantWinnings: averageWinnings.average,
        totalPool: marketData.totalPool + marketData.entryFee
      },
      status: 'eligible',
      message: 'Average potential winnings across all predictions',
      displayVariant: 'info',
      icon: 'TrendingUp'
    }
  }

  private static calculatePotentialWinningsForParticipant(
    marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    const potentialWinnings = this.calculatePotentialWinnings(marketData, participantData.prediction, true)
    
    return {
      type: 'potential',
      amount: potentialWinnings,
      status: 'eligible',
      message: `Potential winnings for your ${participantData.prediction} prediction`,
      displayVariant: 'info',
      icon: 'Target'
    }
  }

  private static calculatePotentialWinningsForCreatorParticipant(
    marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    const participantWinnings = this.calculatePotentialWinnings(marketData, participantData.prediction, true)
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'potential',
      amount: participantWinnings + creatorReward,
      breakdown: {
        participantWinnings,
        creatorReward,
        totalPool: marketData.totalPool
      },
      status: 'eligible',
      message: `Potential winnings (${participantData.prediction} prediction + creator reward)`,
      displayVariant: 'info',
      icon: 'Crown'
    }
  }

  private static calculatePotentialCreatorReward(marketData: MarketData): WinningsResult {
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'creator_reward',
      amount: creatorReward,
      status: 'eligible',
      message: 'Potential creator reward (2% of total pool)',
      displayVariant: 'info',
      icon: 'Award'
    }
  }

  private static calculateActualWinningsForWinner(
    marketData: MarketData, 
    participantData: ParticipantData,
    matchData: EnhancedMatchData
  ): WinningsResult {
    const actualWinnings = this.calculateActualWinnings(marketData, participantData)
    const winnerCount = this.getPredictionCount(marketData, matchData.matchResult!)
    
    return {
      type: 'actual',
      amount: actualWinnings,
      breakdown: {
        participantWinnings: actualWinnings,
        totalPool: marketData.totalPool,
        winnerCount
      },
      status: 'won',
      message: `You won! Correct ${participantData.prediction} prediction`,
      displayVariant: 'success',
      icon: 'Trophy'
    }
  }

  private static calculateLossForParticipant(
    _marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    return {
      type: 'none',
      amount: 0,
      status: 'lost',
      message: `Your ${participantData.prediction} prediction was incorrect`,
      displayVariant: 'error',
      icon: 'X'
    }
  }

  private static calculateEndedCreatorParticipantWinnings(
    marketData: MarketData, 
    participantData: ParticipantData,
    matchData: EnhancedMatchData
  ): WinningsResult {
    const isWinner = matchData.matchResult === participantData.prediction
    const participantWinnings = isWinner ? this.calculateActualWinnings(marketData, participantData) : 0
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'actual',
      amount: participantWinnings + creatorReward,
      breakdown: {
        participantWinnings,
        creatorReward,
        totalPool: marketData.totalPool
      },
      status: 'pending',
      message: isWinner 
        ? `Match ended! You won ${participantData.prediction} + creator reward (pending resolution)`
        : `Match ended! Creator reward only (${participantData.prediction} prediction incorrect)`,
      displayVariant: isWinner ? 'success' : 'warning',
      icon: 'Clock'
    }
  }

  private static calculateEndedCreatorReward(marketData: MarketData): WinningsResult {
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'creator_reward',
      amount: creatorReward,
      status: 'pending',
      message: 'Match ended! Creator reward pending resolution',
      displayVariant: 'warning',
      icon: 'Clock'
    }
  }

  private static calculateResolvedParticipantWinnings(
    marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    const actualWinnings = this.calculateActualWinnings(marketData, participantData)
    const winnerCount = this.getPredictionCount(marketData, marketData.outcome!)
    
    return {
      type: 'actual',
      amount: actualWinnings,
      breakdown: {
        participantWinnings: actualWinnings,
        totalPool: marketData.totalPool,
        winnerCount
      },
      status: 'distributed',
      message: `Winnings distributed! Correct ${participantData.prediction} prediction`,
      displayVariant: 'success',
      icon: 'CheckCircle'
    }
  }

  private static calculateResolvedParticipantLoss(
    _marketData: MarketData, 
    participantData: ParticipantData
  ): WinningsResult {
    return {
      type: 'none',
      amount: 0,
      status: 'distributed',
      message: `Market resolved. Your ${participantData.prediction} prediction was incorrect`,
      displayVariant: 'error',
      icon: 'XCircle'
    }
  }

  private static calculateResolvedCreatorReward(marketData: MarketData): WinningsResult {
    const creatorReward = this.calculateCreatorReward(marketData)
    
    return {
      type: 'creator_reward',
      amount: creatorReward,
      status: 'distributed',
      message: 'Creator reward has been distributed',
      displayVariant: 'success',
      icon: 'CheckCircle'
    }
  }

  private static createNoWinningsResult(): WinningsResult {
    return {
      type: 'none',
      amount: 0,
      status: 'eligible',
      message: 'No winnings information available',
      displayVariant: 'info',
      icon: 'Info'
    }
  }
}