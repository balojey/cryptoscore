export interface MarketDashboardInfo {
  marketAddress: `0x${string}`
  matchId: bigint
  creator: `0x${string}`
  entryFee: bigint
  resolved: boolean
  winner: number
  participantsCount: bigint
  isPublic: boolean
  startTime: bigint
}
