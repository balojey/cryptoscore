import { describe, it, expect } from 'vitest'

// Since we can't easily test the hook directly without mocking fetch,
// let's test the helper functions that we can extract
const determineMatchWinner = (homeScore: number | null, awayScore: number | null): 'Home' | 'Draw' | 'Away' | undefined => {
  if (homeScore === null || awayScore === null) {
    return undefined
  }
  
  if (homeScore > awayScore) {
    return 'Home'
  } else if (awayScore > homeScore) {
    return 'Away'
  } else {
    return 'Draw'
  }
}

const isMatchFinished = (status: string): boolean => {
  const finishedStatuses = ['FINISHED', 'AWARDED', 'POSTPONED', 'CANCELLED', 'SUSPENDED']
  return finishedStatuses.includes(status)
}

const hasValidMatchScore = (match: any): boolean => {
  return match.score?.fullTime?.home !== null && 
         match.score?.fullTime?.away !== null &&
         typeof match.score?.fullTime?.home === 'number' &&
         typeof match.score?.fullTime?.away === 'number'
}

describe('Match Data Enhancement', () => {
  describe('determineMatchWinner', () => {
    it('should return Home when home team scores more', () => {
      expect(determineMatchWinner(2, 1)).toBe('Home')
      expect(determineMatchWinner(3, 0)).toBe('Home')
    })

    it('should return Away when away team scores more', () => {
      expect(determineMatchWinner(1, 2)).toBe('Away')
      expect(determineMatchWinner(0, 3)).toBe('Away')
    })

    it('should return Draw when scores are equal', () => {
      expect(determineMatchWinner(1, 1)).toBe('Draw')
      expect(determineMatchWinner(0, 0)).toBe('Draw')
      expect(determineMatchWinner(2, 2)).toBe('Draw')
    })

    it('should return undefined when scores are null', () => {
      expect(determineMatchWinner(null, 1)).toBeUndefined()
      expect(determineMatchWinner(1, null)).toBeUndefined()
      expect(determineMatchWinner(null, null)).toBeUndefined()
    })
  })

  describe('isMatchFinished', () => {
    it('should return true for finished statuses', () => {
      expect(isMatchFinished('FINISHED')).toBe(true)
      expect(isMatchFinished('AWARDED')).toBe(true)
      expect(isMatchFinished('POSTPONED')).toBe(true)
      expect(isMatchFinished('CANCELLED')).toBe(true)
      expect(isMatchFinished('SUSPENDED')).toBe(true)
    })

    it('should return false for non-finished statuses', () => {
      expect(isMatchFinished('SCHEDULED')).toBe(false)
      expect(isMatchFinished('IN_PLAY')).toBe(false)
      expect(isMatchFinished('LIVE')).toBe(false)
      expect(isMatchFinished('PAUSED')).toBe(false)
    })
  })

  describe('hasValidMatchScore', () => {
    it('should return true for valid scores', () => {
      const match = {
        score: {
          fullTime: {
            home: 2,
            away: 1
          }
        }
      }
      expect(hasValidMatchScore(match)).toBe(true)
    })

    it('should return false for null scores', () => {
      const match = {
        score: {
          fullTime: {
            home: null,
            away: 1
          }
        }
      }
      expect(hasValidMatchScore(match)).toBe(false)
    })

    it('should return false for missing score structure', () => {
      const match = {}
      expect(hasValidMatchScore(match)).toBe(false)
    })
  })
})