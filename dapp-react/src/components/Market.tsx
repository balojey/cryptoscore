export function Market({ match }: { match: any }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
      <h3>
        {match.homeTeam.name}
        {' '}
        vs
        {' '}
        {match.awayTeam.name}
      </h3>
      <p>
        Date:
        {new Date(match.utcDate).toLocaleString()}
      </p>
      <p>
        Competition:
        {match.competition.name}
      </p>
    </div>
  )
}
