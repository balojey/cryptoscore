import { useState, useEffect } from 'react';
import { Market } from './Market';

const COMPETITIONS = ['PL', 'CL', 'EL', 'BL1', 'SA', 'PD', 'FL1'];

export const Markets = () => {
  const [matches, setMatches] = useState([]);
  const [competition, setCompetition] = useState('PL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://corsproxy.io/?https://api.football-data.org/v4/competitions/${competition}/matches?status=SCHEDULED`, {
          headers: {
            'X-Auth-Token': import.meta.env.VITE_FOOTBALL_DATA_API_KEY, // Replace with your actual API key
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        console.log(data);
        setMatches(data.matches);
      } catch (err) {
        setError('Could not fetch matches. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [competition]);

  return (
    <div>
      <div>
        {COMPETITIONS.map((comp) => (
          <button key={comp} onClick={() => setCompetition(comp)}>
            {comp}
          </button>
        ))}
      </div>
      {loading && <p>Loading matches...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p>No future matches for this competition. Please select another one.</p>
      )}
      <div>
        {matches.map((match) => (
          <Market key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};
