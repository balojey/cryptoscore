import { useParams } from 'react-router-dom';

export function MarketDetail() {
  const { marketAddress } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Market Detail</h1>
      <p>Details for market: {marketAddress}</p>
      {/* TODO: Implement market detail view */}
    </div>
  );
}
