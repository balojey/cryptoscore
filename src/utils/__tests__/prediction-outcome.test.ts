import { describe, it, expect } from 'vitest'
import { determinePredictionOutcome, getPredictionOutcomeMessage } from '../prediction-outcome'
import type { EnhancedMatchData } from '../../hooks/useMatchData'

describe('prediction-outcome', () => {
  const mockFinishedMatch: EnhancedMatchData = {
    id: 1,
    utcDate: '2024-01-01T15:00:00Z',
    status: 'FINISHED',
    homeTeam: { id: 1, name: 'Team A', crest: 'crest-a.png' },
    awayTeam: { id: 2, name: 'Team B', crest: 'crest-b.png' },
    competition: { id: 1, name: 'Test League' },
    score: {
      fullTime: { home: 2, away: 1 }
    },
    matchResult: 'Home',
    isFinished: true,
    hasValidScore: true
  }

  const mockUnfinishedMatch: EnhancedMatchData = {
    ...mockFinishedMatch,
    status: 'IN_PLAY',
    isFinished: false,
    hasValidScore: false,
    matchResult: undefined
  }

  describe('determinePredictionOutcome', () => {
    it('should return correct outcome for correct prediction', () => {
      const outcome = determinePredictionOutcome('Home', mockFinishedMatch)
      
      expect(outcome.isCorrect).toBe(true)
      expect(outcome.matchResult).toBe('Home')
      expect(outcome.canDetermineOutcome).toBe(true)
      expect(outcome.outcomeMessage).toBe('Correct prediction!')
    })

    it('should return incorrect outcome for wrong prediction', () => {
      const outcome = determinePredictionOutcome('Away', mockFinishedMatch)
      
      expect(outcome.isCorrect).toBe(false)
      expect(outcome.matchResult).toBe('Home')
      expect(outcome.canDetermineOutcome).toBe(true)
      expect(outcome.outcomeMessage).toBe('Incorrect prediction')
    })

    it('should return undefined outcome for unfinished match', () => {
      const outcome = determinePredictionOutcome('Home', mockUnfinishedMatch)
      
      expect(outcome.isCorrect).toBeUndefined()
      expect(outcome.canDetermineOutcome).toBe(false)
      expect(outcome.outcomeMessage).toBe('Match in progress')
    })

    it('should handle null match data', () => {
      const outcome = determinePredictionOutcome('Home', null)
      
      expect(outcome.isCorrect).toBeUndefined()
      expect(outcome.canDetermineOutcome).toBe(false)
      expect(outcome.outcomeMessage).toBe('Match data not available')
    })
  })

  describe('getPredictionOutcomeMessage', () => {
    it('should return correct message for winning prediction', () => {
      const outcome = determinePredictionOutcome('Home', mockFinishedMatch)
      const message = getPredictionOutcomeMessage('Home', outcome, 'Team A', 'Team B')
      
      expect(message).toBe('✓ Correct! You predicted Team A win')
    })

    it('should return incorrect message for losing prediction', () => {
      const outcome = determinePredictionOutcome('Away', mockFinishedMatch)
      const message = getPredictionOutcomeMessage('Away', outcome, 'Team A', 'Team B')
      
      expect(message).toBe('✗ Incorrect. You predicted Team B win, but the result was Team A win')
    })

    it('should return pending message for unfinished match', () => {
      const outcome = determinePredictionOutcome('Home', mockUnfinishedMatch)
      const message = getPredictionOutcomeMessage('Home', outcome, 'Team A', 'Team B')
      
      expect(message).toBe('Match in progress')
    })
  })
})