import type { Match } from '../types'
import { useEffect, useState } from 'react'
import { getRandomApiKey } from '../utils/apiKey'

const API_URL = 'https://api.football-data.org/v4/matches/'

export function useMatchData(matchId: number) {
  const [data, setData] = useState<Match | null>(null)
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
        console.log(result)
        setData(result as Match)
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
