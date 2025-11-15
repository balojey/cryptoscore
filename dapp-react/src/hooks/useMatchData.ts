
import { useState, useEffect } from 'react';
import { Match } from '../types';

const API_KEY = import.meta.env.VITE_FOOTBALL_DATA_API_KEY;
const API_URL = 'https://api.football-data.org/v4/matches/';

export const useMatchData = (matchId: number) => {
  const [data, setData] = useState<Match | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}${matchId}`, {
          headers: {
            'X-Auth-Token': API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result as Match);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId]);

  return { data, loading, error };
};
