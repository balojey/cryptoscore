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
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log(result)
        setData(result as Match)
      }
      catch (e: any) {
        setError(e.message || 'Failed to fetch match data')
      }
      finally {
        setLoading(false)
      }
    }

    fetchMatchData()
  }, [matchId])

  return { data, loading, error }
}
