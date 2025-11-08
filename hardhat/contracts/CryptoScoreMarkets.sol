// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CryptoScoreMarkets - Sports prediction market factory with multi-winner payout
/// @notice Supports multiple winners and distributes winnings automatically using enum predictions
contract CryptoScoreMarkets {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MarketCreated(
        uint256 indexed marketId,
        uint256 indexed matchId,
        address indexed creator,
        bool isPublic,
        uint256 price
    );
    event MarketResolved(
        uint256 indexed marketId,
        string winner,
        address[] winners,
        address resolvedBy
    );
    event Withdrawal(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), owner);
        _reentrancyStatus = _NOT_ENTERED;
    }

    /* -------------------------------------------------------------------
       Ownable
       ------------------------------------------------------------------- */
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /* -------------------------------------------------------------------
       Reentrancy Guard
       ------------------------------------------------------------------- */
    uint8 private _reentrancyStatus;
    uint8 private constant _NOT_ENTERED = 1;
    uint8 private constant _ENTERED = 2;
    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "ReentrancyGuard: reentrant call");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    /* -------------------------------------------------------------------
       Prediction Enum
       ------------------------------------------------------------------- */
    enum Prediction { NONE, HOME, AWAY, DRAW }

    /* -------------------------------------------------------------------
       Structs
       ------------------------------------------------------------------- */
    struct MatchMarket {
        uint256 marketId;
        address creator;
        uint256 matchId;
        bool isPublic;
        uint256 price;
        string homeTeam;
        string awayTeam;
        string utcDate;
        string competition;
        string area;
        string status;
        bool resolved;
        Prediction winner;
        address[] participants;
        mapping(address => Prediction) predictions;
        address[] winners;
    }

    struct MatchMarketView {
        uint256 marketId;
        address creator;
        uint256 matchId;
        bool isPublic;
        uint256 price;
        string homeTeam;
        string awayTeam;
        string utcDate;
        string competition;
        string area;
        string status;
        bool resolved;
        Prediction winner;
        address[] participants;
        address[] winners;
    }

    uint256 public totalMarkets;
    mapping(uint256 => MatchMarket[]) public marketsByMatchId;
    mapping(address => uint256[]) public userMarkets;

    /// @notice Pending withdrawals for the pull-over-push pattern
    mapping(address => uint256) public pendingWithdrawals;

    /* -------------------------------------------------------------------
       Helpers
       ------------------------------------------------------------------- */
    modifier validMarketIndex(uint256 _matchId, uint256 _marketIndex) {
        require(_marketIndex < marketsByMatchId[_matchId].length, "Invalid market index");
        _;
    }

    function _isParticipant(MatchMarket storage market, address user) internal view returns (bool) {
        address[] storage parts = market.participants;
        for (uint256 i = 0; i < parts.length; i++) {
            if (parts[i] == user) return true;
        }
        return false;
    }

    function _creatorHasMarket(uint256 _matchId, address creator) internal view returns (bool) {
        MatchMarket[] storage arr = marketsByMatchId[_matchId];
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i].creator == creator) return true;
        }
        return false;
    }

    /// @notice Checks whether a user has already created a market for a given match
    function hasCreatedMarket(uint256 _matchId, address _creator) external view returns (bool) {
        return _creatorHasMarket(_matchId, _creator);
    }

    /* -------------------------------------------------------------------
       Core Functions
       ------------------------------------------------------------------- */
    function createMarket(
        uint256 _matchId,
        string memory _homeTeam,
        string memory _awayTeam,
        string memory _utcDate,
        string memory _competition,
        string memory _area,
        string memory _matchStatus,
        bool _isPublic,
        uint256 _price
    ) public {
        require(_price > 0, "Price must be > 0");
        require(!_creatorHasMarket(_matchId, msg.sender), "Creator already has a market for this match");

        totalMarkets += 1;
        uint256 newMarketId = totalMarkets;

        MatchMarket storage m = marketsByMatchId[_matchId].push();
        m.marketId = newMarketId;
        m.creator = msg.sender;
        m.matchId = _matchId;
        m.isPublic = _isPublic;
        m.price = _price;
        m.homeTeam = _homeTeam;
        m.awayTeam = _awayTeam;
        m.utcDate = _utcDate;
        m.competition = _competition;
        m.area = _area;
        m.status = _matchStatus;
        m.resolved = false;
        m.winner = Prediction.NONE;

        userMarkets[msg.sender].push(newMarketId);

        emit MarketCreated(newMarketId, _matchId, msg.sender, _isPublic, _price);
    }

    function joinMarket(uint256 _matchId, uint256 _marketIndex, Prediction _prediction)
        external
        payable
        nonReentrant
        validMarketIndex(_matchId, _marketIndex)
    {
        MatchMarket storage market = marketsByMatchId[_matchId][_marketIndex];
        require(!market.resolved, "Market already resolved");
        require(msg.value == market.price, "Incorrect ETH value sent");
        require(_prediction != Prediction.NONE, "Invalid prediction");

        if (!market.isPublic) revert("Private markets cannot be joined without invitation");
        require(!_isParticipant(market, msg.sender), "Already joined this market");

        market.participants.push(msg.sender);
        market.predictions[msg.sender] = _prediction;
    }

    function resolveMarket(uint256 _matchId, uint256 _marketIndex, Prediction _winner)
        external
        nonReentrant
        validMarketIndex(_matchId, _marketIndex)
    {
        MatchMarket storage market = marketsByMatchId[_matchId][_marketIndex];

        require(!market.resolved, "Market already resolved");
        require(_isParticipant(market, msg.sender), "Only participant can resolve");
        require(_winner != Prediction.NONE, "Winner cannot be NONE");

        market.resolved = true;
        market.winner = _winner;

        uint256 winnerCount = 0;
        for (uint256 i = 0; i < market.participants.length; i++) {
            address participant = market.participants[i];
            if (market.predictions[participant] == _winner) {
                market.winners.push(participant);
                winnerCount++;
            }
        }

        require(winnerCount > 0, "No winners to distribute");

        uint256 totalPot = market.price * market.participants.length;

        for (uint256 i = 0; i < market.winners.length; i++) {
            address winnerAddr = market.winners[i];
            uint256 perWinnerShare = totalPot / winnerCount;
            uint256 creatorFee = (perWinnerShare * 1) / 100;
            uint256 ownerFee = (perWinnerShare * 1) / 100;
            uint256 payout = perWinnerShare - creatorFee - ownerFee;

            pendingWithdrawals[winnerAddr] += payout;
            pendingWithdrawals[market.creator] += creatorFee;
            pendingWithdrawals[owner] += ownerFee;
        }

        emit MarketResolved(
            market.marketId,
            _winner == Prediction.HOME ? "HOME" : _winner == Prediction.AWAY ? "AWAY" : "DRAW",
            market.winners,
            msg.sender
        );
    }

    /// @notice Withdraw any pending winnings safely
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdraw failed");

        emit Withdrawal(msg.sender, amount);
    }

    /* -------------------------------------------------------------------
       View / Utility
       ------------------------------------------------------------------- */
    function getMarketsByMatch(uint256 _matchId) external view returns (MatchMarketView[] memory) {
        MatchMarket[] storage arr = marketsByMatchId[_matchId];
        uint256 len = arr.length;
        MatchMarketView[] memory copy = new MatchMarketView[](len);

        for (uint256 i = 0; i < len; i++) {
            MatchMarket storage s = arr[i];
            copy[i].marketId = s.marketId;
            copy[i].creator = s.creator;
            copy[i].matchId = s.matchId;
            copy[i].isPublic = s.isPublic;
            copy[i].price = s.price;
            copy[i].homeTeam = s.homeTeam;
            copy[i].awayTeam = s.awayTeam;
            copy[i].utcDate = s.utcDate;
            copy[i].competition = s.competition;
            copy[i].area = s.area;
            copy[i].status = s.status;
            copy[i].resolved = s.resolved;
            copy[i].winner = s.winner;
            copy[i].participants = s.participants;
            copy[i].winners = s.winners;
        }

        return copy;
    }

    function getUserMarkets(address _user) external view returns (uint256[] memory) {
        return userMarkets[_user];
    }

    function getPrediction(uint256 _matchId, uint256 _marketIndex, address _participant)
        external
        view
        validMarketIndex(_matchId, _marketIndex)
        returns (Prediction)
    {
        return marketsByMatchId[_matchId][_marketIndex].predictions[_participant];
    }

    function getParticipants(uint256 _matchId, uint256 _marketIndex)
        external
        view
        validMarketIndex(_matchId, _marketIndex)
        returns (address[] memory)
    {
        return marketsByMatchId[_matchId][_marketIndex].participants;
    }

    function getWinners(uint256 _matchId, uint256 _marketIndex)
        external
        view
        validMarketIndex(_matchId, _marketIndex)
        returns (address[] memory)
    {
        return marketsByMatchId[_matchId][_marketIndex].winners;
    }

    receive() external payable {}
    fallback() external payable {}
}
