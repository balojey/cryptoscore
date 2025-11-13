import { Link } from 'react-router-dom';
import { type MarketDashboardInfo } from '../types'; // Assuming you have a types file

export function MarketInfoCard({ market }: { market: MarketDashboardInfo }) {
  return (
    <Link to={`/market/${market.marketAddress}`} className="block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Market: {market.marketAddress.slice(0, 6)}...{market.marketAddress.slice(-4)}</h3>
        <span className={`badge ${market.isPublic ? 'badge-accent' : 'badge-secondary'}`}>
          {market.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
      <p className="text-sm text-gray-600">Created by: {market.creator.slice(0, 6)}...{market.creator.slice(-4)}</p>
      <p className="text-sm text-gray-600">Entry Fee: {market.entryFee.toString()} wei</p>
      <p className="text-sm text-gray-600">Participants: {market.participantsCount.toString()}</p>
      <p className="text-sm text-gray-600">Start Time: {new Date(Number(market.startTime) * 1000).toLocaleString()}</p>
      {market.resolved && (
        <p className="text-sm font-bold">Resolved</p>
      )}
    </Link>
  );
}