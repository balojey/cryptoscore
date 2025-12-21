import type { Match } from '../types'
import { useEffect, useState } from 'react'
import { getRandomApiKey } from '../utils/apiKey'

const API_URL = 'https://api.football-data.org/v4/matches/'

export interface EnhancedMatchData extends Match {
  matchResult?: 'Home' | 'Draw' | 'Away'
  isFinished: boolean
  hasValidScore: boolean
}

/**
 * Determines the match winner based on full-time scores
 */
function determineMatchWinner(homeScore: number | null, awayScore: number | null): 'Home' | 'Draw' | 'Away' | undefined {
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

/**
 * Checks if a match has finished based on status
 */
function isMatchFinished(status: string): boolean {
  const finishedStatuses = ['FINISHED', 'AWARDED', 'POSTPONED', 'CANCELLED', 'SUSPENDED']
  return finishedStatuses.includes(status)
}

/**
 * Checks if match has valid scores available
 */
function hasValidMatchScore(match: Match): boolean {
  return match.score?.fullTime?.home !== null && 
         match.score?.fullTime?.away !== null &&
         typeof match.score.fullTime.home === 'number' &&
         typeof match.score.fullTime.away === 'number'
}

/**
 * Enhances match data with score analysis and result determination
 */
function enhanceMatchData(match: Match): EnhancedMatchData {
  const isFinished = isMatchFinished(match.status)
  const hasValidScore = hasValidMatchScore(match)
  
  let matchResult: 'Home' | 'Draw' | 'Away' | undefined
  
  // Only determine result if match is finished and has valid scores
  if (isFinished && hasValidScore) {
    matchResult = determineMatchWinner(
      match.score.fullTime.home,
      match.score.fullTime.away
    )
  }
  
  return {
    ...match,
    matchResult,
    isFinished,
    hasValidScore
  }
}

export function useMatchData(matchId: number) {
  const [data, setData] = useState<EnhancedMatchData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const apiKey = getRandomApiKey()
        const response = await fetch(`https://corsproxy.io/?${API_URL}${matchId}`, {
          headers: {
            'X-Auth-Token': apiKey,
          },
        })

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 429) {
            throw new Error('API rate limit reached. Please try again in a moment.')
          }
          if (response.status === 404) {
            throw new Error('Match not found')
          }
          if (response.status === 403) {
            throw new Error('API access denied. Please check API key.')
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('Raw match data:', result)
        
        // Enhance match data with score analysis
        const enhancedData = enhanceMatchData(result as Match)
        console.log('Enhanced match data:', enhancedData)
        
        setData(enhancedData)
      }
      catch (e: any) {
        const errorMessage = e.message || 'Failed to fetch match data'
        console.error('Match data fetch error:', errorMessage)
        setError(errorMessage)

        // For rate limit errors, don't set data to null to preserve any cached data
        if (!errorMessage.includes('rate limit')) {
          setData(null)
        }
      }
      finally {
        setLoading(false)
      }
    }

    fetchMatchData()
  }, [matchId])

  return { data, loading, error }
}
