// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CryptoScoreFactory.sol";
import "./CryptoScoreMarket.sol";

/// @title CryptoScoreDashboard - Fetches paginated market data for frontend
contract CryptoScoreDashboard {
    CryptoScoreFactory public factory;

    struct MarketDashboardInfo {
        address marketAddress;
        uint256 matchId;
        address creator;
        uint256 entryFee;
        bool resolved;
        CryptoScoreMarket.Prediction winner;
        uint256 participantsCount;
        bool isPublic;
        uint256 startTime;
        uint256 homeCount;
        uint256 awayCount;
        uint256 drawCount;
    }

    constructor(address _factory) {
        factory = CryptoScoreFactory(_factory);
    }

    /// @notice Get paginated dashboard data for a specific user
    /// @param user The user address
    /// @param offset Starting index for pagination
    /// @param limit Maximum number of markets to return
    /// @param createdOnly If true, return markets created by the user; if false, return markets where user is a participant
    function getUserMarketsDashboardPaginated(
        address user,
        uint256 offset,
        uint256 limit,
        bool createdOnly
    )
        external
        view
        returns (MarketDashboardInfo[] memory)
    {
        address[] memory relevantMarkets;

        if (createdOnly) {
            relevantMarkets = factory.getUserMarkets(user);
        } else {
            // Count participant markets
            uint256 participantCount = 0;
            for (uint256 i = 0; i < factory.allMarketsLength(); i++) {
                CryptoScoreFactory.MarketInfo memory info = factory.allMarketsAt(i);
                CryptoScoreMarket market = CryptoScoreMarket(info.marketAddress);
                if (market.isParticipant(user)) {
                    participantCount++;
                }
            }

            relevantMarkets = new address[](participantCount);
            uint256 fillIndex = 0;
            for (uint256 i = 0; i < factory.allMarketsLength(); i++) {
                CryptoScoreFactory.MarketInfo memory info = factory.allMarketsAt(i);
                CryptoScoreMarket market = CryptoScoreMarket(info.marketAddress);
                if (market.isParticipant(user)) {
                    relevantMarkets[fillIndex] = info.marketAddress;
                    fillIndex++;
                }
            }
        }

        uint256 total = relevantMarkets.length;
        if (offset >= total) {
            return new MarketDashboardInfo[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 size = end - offset;
        MarketDashboardInfo[] memory dashboardData = new MarketDashboardInfo[](size);

        for (uint256 i = 0; i < size; i++) {
            address marketAddr = relevantMarkets[offset + i];
            CryptoScoreMarket market = CryptoScoreMarket(marketAddr);
            CryptoScoreFactory.MarketInfo memory info = factory.getMarketInfo(marketAddr);

            (uint256 home, uint256 away, uint256 draw) = market.getPredictionCounts();
            
            dashboardData[i] = MarketDashboardInfo({
                marketAddress: marketAddr,
                matchId: info.matchId,
                creator: info.creator,
                entryFee: info.entryFee,
                resolved: market.resolved(),
                winner: market.winner(),
                participantsCount: market.getParticipantsCount(),
                isPublic: market.isPublic(),
                startTime: market.startTime(),
                homeCount: home,
                awayCount: away,
                drawCount: draw
            });
        }

        return dashboardData;
    }

    /// @notice Get paginated dashboard data for all markets, optionally filtered by publicity
    /// @param offset Starting index for pagination
    /// @param limit Maximum number of markets to return
    /// @param onlyPublic If true, return only public markets; if false, return all markets
    function getMarketsDashboardPaginated(
        uint256 offset,
        uint256 limit,
        bool onlyPublic
    )
        external
        view
        returns (MarketDashboardInfo[] memory)
    {
        uint256 totalCount = 0;
        for (uint256 i = 0; i < factory.allMarketsLength(); i++) {
            CryptoScoreFactory.MarketInfo memory info = factory.allMarketsAt(i);
            CryptoScoreMarket market = CryptoScoreMarket(info.marketAddress);
            if (!onlyPublic || market.isPublic()) {
                totalCount++;
            }
        }

        if (offset >= totalCount) {
            return new MarketDashboardInfo[](0); // fixed
        }

        uint256 end = offset + limit;
        if (end > totalCount) {
            end = totalCount;
        }

        uint256 size = end - offset;
        MarketDashboardInfo[] memory dashboardData = new MarketDashboardInfo[](size);

        uint256 idx = 0;
        for (uint256 i = 0; i < factory.allMarketsLength() && idx < end; i++) {
            CryptoScoreFactory.MarketInfo memory info = factory.allMarketsAt(i);
            CryptoScoreMarket market = CryptoScoreMarket(info.marketAddress);

            if (!onlyPublic || market.isPublic()) {
                if (idx >= offset) {
                    (uint256 home, uint256 away, uint256 draw) = market.getPredictionCounts();
                    
                    dashboardData[idx - offset] = MarketDashboardInfo({
                        marketAddress: info.marketAddress,
                        matchId: info.matchId,
                        creator: info.creator,
                        entryFee: info.entryFee,
                        resolved: market.resolved(),
                        winner: market.winner(),
                        participantsCount: market.getParticipantsCount(),
                        isPublic: market.isPublic(),
                        startTime: market.startTime(),
                        homeCount: home,
                        awayCount: away,
                        drawCount: draw
                    });
                }
                idx++;
            }
        }

        return dashboardData;
    }
}
