// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CryptoScoreMarket.sol";

/// @title CryptoScoreFactory - Deploys and tracks all match markets
contract CryptoScoreFactory {
    address public owner;
    uint256 public totalMarkets;

    struct MarketInfo {
        address marketAddress;
        uint256 matchId;
        address creator;
        uint256 entryFee;
    }

    struct MarketDashboardInfo {
        address marketAddress;
        uint256 matchId;
        address creator;
        uint256 entryFee;
        bool resolved;
        CryptoScoreMarket.Prediction winner;
        uint256 participantsCount;
    }

    mapping(uint256 => MarketInfo[]) public marketsByMatch;
    mapping(address => address[]) public userMarkets;
    MarketInfo[] public allMarkets;
    mapping(address => MarketInfo) public marketInfoByAddress; // <-- new mapping

    event MarketCreated(uint256 indexed matchId, address indexed marketAddress, address indexed creator);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Deploy a new market for a match
    function createMarket(uint256 _matchId, uint256 _entryFee) external returns (address) {
        require(_entryFee > 0, "Fee must be > 0");
        totalMarkets += 1;

        CryptoScoreMarket market = new CryptoScoreMarket(msg.sender, _matchId, _entryFee);

        MarketInfo memory info = MarketInfo(address(market), _matchId, msg.sender, _entryFee);
        marketsByMatch[_matchId].push(info);
        userMarkets[msg.sender].push(address(market));
        allMarkets.push(info);
        marketInfoByAddress[address(market)] = info; // <-- store in mapping

        emit MarketCreated(_matchId, address(market), msg.sender);

        return address(market);
    }

    /// @notice Get all markets for a match
    function getMarkets(uint256 _matchId) external view returns (MarketInfo[] memory) {
        return marketsByMatch[_matchId];
    }

    /// @notice Get markets created by a user
    function getUserMarkets(address user) external view returns (address[] memory) {
        return userMarkets[user];
    }

    /// @notice Get paginated dashboard data for all markets
    function getMarketsDashboardPaginated(uint256 offset, uint256 limit)
        external
        view
        returns (MarketDashboardInfo[] memory)
    {
        uint256 total = allMarkets.length;

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
            MarketInfo memory info = allMarkets[offset + i];
            CryptoScoreMarket market = CryptoScoreMarket(info.marketAddress);

            dashboardData[i] = MarketDashboardInfo({
                marketAddress: info.marketAddress,
                matchId: info.matchId,
                creator: info.creator,
                entryFee: info.entryFee,
                resolved: market.resolved(),
                winner: market.winner(),
                participantsCount: market.getParticipantsCount()
            });
        }

        return dashboardData;
    }

    /// @notice Get paginated dashboard data for a user's markets
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
            relevantMarkets = userMarkets[user];
        } else {
            // Count participant markets
            uint256 count = 0;
            for (uint256 i = 0; i < allMarkets.length; i++) {
                CryptoScoreMarket market = CryptoScoreMarket(allMarkets[i].marketAddress);
                if (market.isParticipant(user)) {
                    count++;
                }
            }

            relevantMarkets = new address[](count);
            uint256 idx = 0;
            for (uint256 i = 0; i < allMarkets.length; i++) {
                CryptoScoreMarket market = CryptoScoreMarket(allMarkets[i].marketAddress);
                if (market.isParticipant(user)) {
                    relevantMarkets[idx] = allMarkets[i].marketAddress;
                    idx++;
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
            MarketInfo memory info = marketInfoByAddress[marketAddr];

            dashboardData[i] = MarketDashboardInfo({
                marketAddress: marketAddr,
                matchId: info.matchId,
                creator: info.creator,
                entryFee: info.entryFee,
                resolved: market.resolved(),
                winner: market.winner(),
                participantsCount: market.getParticipantsCount()
            });
        }

        return dashboardData;
    }
}
