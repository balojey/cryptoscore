// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CryptoScoreMarket.sol";

/// @title CryptoScoreFactory - Deploys and stores match markets
contract CryptoScoreFactory {
    address public owner;
    uint256 public totalMarkets;

    struct MarketInfo {
        address marketAddress;
        uint256 matchId;
        address creator;
        uint256 entryFee;
        bool isPublic;
        uint256 startTime;
    }

    MarketInfo[] public allMarkets;
    mapping(address => MarketInfo) public marketInfoByAddress;
    mapping(address => address[]) public userMarkets;
    mapping(uint256 => address[]) public marketsByMatch;

    event MarketCreated(uint256 indexed matchId, address indexed marketAddress, address indexed creator);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Deploy a new market
    function createMarket(
        uint256 _matchId,
        uint256 _entryFee,
        bool _isPublic,
        uint256 _startTime
    ) external returns (address) {
        require(_entryFee > 0, "Fee must be > 0");

        CryptoScoreMarket market = new CryptoScoreMarket(
            msg.sender,
            _matchId,
            _entryFee,
            _isPublic,
            _startTime
        );

        MarketInfo memory info = MarketInfo({
            marketAddress: address(market),
            matchId: _matchId,
            creator: msg.sender,
            entryFee: _entryFee,
            isPublic: _isPublic,
            startTime: _startTime
        });

        allMarkets.push(info);
        marketInfoByAddress[address(market)] = info;
        userMarkets[msg.sender].push(address(market));
        marketsByMatch[_matchId].push(address(market));

        totalMarkets++;
        emit MarketCreated(_matchId, address(market), msg.sender);

        return address(market);
    }

    /// @notice Get all markets for a match
    function getMarkets(uint256 _matchId) external view returns (address[] memory) {
        return marketsByMatch[_matchId];
    }

    /// @notice Get markets created by a user
    function getUserMarkets(address _user) external view returns (address[] memory) {
        return userMarkets[_user];
    }

    /// @notice Get all markets
    function getAllMarkets() external view returns (MarketInfo[] memory) {
        return allMarkets;
    }

    function allMarketsLength() external view returns (uint256) {
        return allMarkets.length;
    }

    function allMarketsAt(uint256 index) external view returns (MarketInfo memory) {
        return allMarkets[index];
    }

    function getMarketInfo(address marketAddr) external view returns (MarketInfo memory) {
        return marketInfoByAddress[marketAddr];
    }
}
