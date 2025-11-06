import { useState, useEffect } from 'react';
import { Market } from './Market';

const COMPETITIONS = [
  { code: 'PL', name: 'Premier League' },
  { code: 'CL', name: 'Champions League' },
  { code: 'EL', name: 'Europa League' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'PD', name: 'La Liga' },
  { code: 'FL1', name: 'Ligue 1' },
];

export const Markets = () => {
  const [matches, setMatches] = useState([]);
  const [competition, setCompetition] = useState('PL');
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      let dateFrom = '';
      let dateTo = '';

      if (dateFilter === 'today') {
        dateFrom = formatDate(today);
        dateTo = formatDate(tomorrow);
      } else if (dateFilter === 'next7days') {
        dateFrom = formatDate(today);
        dateTo = formatDate(nextWeek);
      }

      try {
        const response = await fetch(`https://corsproxy.io/?https://api.football-data.org/v4/competitions/${competition}/matches?status=SCHEDULED&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
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
  }, [competition, dateFilter]);

  return (
    <div>
      <div className="competition-filter">
        {COMPETITIONS.map((comp) => (
          <button
            key={comp.code}
            className={competition === comp.code ? 'active' : ''}
            onClick={() => setCompetition(comp.code)}
          >
            {comp.name}
          </button>
        ))}
      </div>
      <div className="date-filter">
        <button
            className={dateFilter === 'today' ? 'active' : ''}
            onClick={() => setDateFilter('today')}
        >
            Today
        </button>
        <button
            className={dateFilter === 'next7days' ? 'active' : ''}
            onClick={() => setDateFilter('next7days')}
        >
            Next 7 days
        </button>
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
