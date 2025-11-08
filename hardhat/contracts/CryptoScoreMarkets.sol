// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CryptoScoreMarkets - Sports prediction market factory
/// @author
/// @notice Factory contract to create prediction markets per football match (multiple independent markets per match allowed).
/// @dev Designed to integrate with an off-chain bot/oracle in later versions. Uses a simple ReentrancyGuard and Ownable implementation.
contract CryptoScoreMarkets {
    /* -------------------------------------------------------------------
       Simple Ownable
       ------------------------------------------------------------------- */
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), owner);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    /// @notice transfer ownership to another address
    /// @param newOwner address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /* -------------------------------------------------------------------
       Simple ReentrancyGuard
       ------------------------------------------------------------------- */
    uint8 private _status;
    uint8 private constant _NOT_ENTERED = 1;
    uint8 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    /* -------------------------------------------------------------------
       Structs, State & Events
       ------------------------------------------------------------------- */

    /// @notice Market structure for a single match-market instance
    struct MatchMarket {
        uint256 marketId;          // Unique identifier for this market
        address creator;           // Market creator address
        uint256 matchId;           // Football match ID (from API)
        bool isPublic;             // Determines if anyone can join
        uint256 price;             // Entry price in wei
        string homeTeam;
        string awayTeam;
        string utcDate;
        string competition;
        string area;
        string status;             // From API ("SCHEDULED", "FINISHED", etc.)
        bool resolved;             // Whether the market has been resolved
        string winner;             // "HOME", "AWAY", "DRAW", or "NONE"
        address[] participants;    // Addresses of users who joined
    }

    /// @notice Total markets created (used to generate unique marketIds)
    uint256 public totalMarkets;

    /// @notice All markets grouped by API matchId. Each match may have multiple markets created by different users.
    mapping(uint256 => MatchMarket[]) public marketsByMatchId;

    /// @notice Markets created by a user (stores marketIds)
    mapping(address => uint256[]) public userMarkets;

    /// @notice Emitted when a market is created.
    event MarketCreated(
        uint256 indexed marketId,
        uint256 indexed matchId,
        address indexed creator,
        bool isPublic,
        uint256 price
    );

    /// @notice Emitted when a market is resolved.
    event MarketResolved(
        uint256 indexed marketId,
        string winner,
        address resolvedBy
    );

    /* -------------------------------------------------------------------
       Modifiers & Internal helpers
       ------------------------------------------------------------------- */

    /**
     * @dev Checks bounds for market index within marketsByMatchId[_matchId] array.
     */
    modifier validMarketIndex(uint256 _matchId, uint256 _marketIndex) {
        require(_marketIndex < marketsByMatchId[_matchId].length, "Invalid market index");
        _;
    }

    /**
     * @dev Internal helper to check whether an address is already a participant in a market.
     */
    function _isParticipant(MatchMarket storage market, address user) internal view returns (bool) {
        address[] storage parts = market.participants;
        for (uint256 i = 0; i < parts.length; i++) {
            if (parts[i] == user) return true;
        }
        return false;
    }

    /**
     * @dev Internal helper to check whether a creator already has a market for a match.
     */
    function _creatorHasMarket(uint256 _matchId, address creator) internal view returns (bool) {
        MatchMarket[] storage arr = marketsByMatchId[_matchId];
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i].creator == creator) {
                return true;
            }
        }
        return false;
    }

    /* -------------------------------------------------------------------
       Core Functions
       ------------------------------------------------------------------- */

    /**
     * @notice Create a new market for a football match.
     * @dev Prevents the same creator from creating multiple markets for the same matchId.
     * @param _matchId The match ID from the football-data.org API
     * @param _homeTeam Home team name
     * @param _awayTeam Away team name
     * @param _utcDate UTC date/time string from API
     * @param _competition Competition name
     * @param _area Area/region string
     * @param _status Match status string from API ("SCHEDULED", "FINISHED", etc.)
     * @param _isPublic If true, anyone can join; if false, join is restricted (in future may require invitations)
     * @param _price Entry price in wei (must be > 0)
     */
    function createMarket(
        uint256 _matchId,
        string memory _homeTeam,
        string memory _awayTeam,
        string memory _utcDate,
        string memory _competition,
        string memory _area,
        string memory _status,
        bool _isPublic,
        uint256 _price
    ) public {
        require(_price > 0, "Price must be > 0");

        // Prevent same creator from creating multiple markets for the same match
        require(!_creatorHasMarket(_matchId, msg.sender), "Creator already has a market for this match");

        // assign unique marketId
        totalMarkets += 1;
        uint256 newMarketId = totalMarkets;

        // initialize participants as empty array
        address[] memory emptyParticipants;

        // Populate and push to storage array
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
        m.status = _status;
        m.resolved = false;
        m.winner = "NONE";

        // participants array is already an empty dynamic array in storage

        // record creator's market list
        userMarkets[msg.sender].push(newMarketId);

        emit MarketCreated(newMarketId, _matchId, msg.sender, _isPublic, _price);
    }

    /**
     * @notice Join an existing market by providing the exact entry price.
     * @dev Uses nonReentrant modifier to protect against reentrancy.
     * @param _matchId The match id grouping the market
     * @param _marketIndex Index within the marketsByMatchId[_matchId] array
     */
    function joinMarket(uint256 _matchId, uint256 _marketIndex)
        external
        payable
        nonReentrant
        validMarketIndex(_matchId, _marketIndex)
    {
        MatchMarket storage market = marketsByMatchId[_matchId][_marketIndex];

        require(!market.resolved, "Market already resolved");
        require(msg.value == market.price, "Incorrect ETH value sent");

        // If market is private (isPublic == false), in future we might check an invite list.
        // For now, disallow joining private markets until invitation mechanic is added.
        if (!market.isPublic) {
            revert("Private markets cannot be joined without an invitation (future feature)");
        }

        // Prevent duplicate joins
        require(!_isParticipant(market, msg.sender), "Already joined this market");

        // Add participant
        market.participants.push(msg.sender);

        // Placeholder: funds are currently held in contract. Future logic should:
        //  - track funds per market
        //  - distribute rewards to winners when market is resolved
        //  - allow withdrawal by market creator/admin for fees, etc.
    }

    /**
     * @notice Resolve a market by declaring the winner.
     * @dev Only a participant in the market can call this function. Market must be unresolved.
     * @param _matchId The match id grouping the market
     * @param _marketIndex Index within the marketsByMatchId[_matchId] array
     * @param _winner Winner string: "HOME", "AWAY", "DRAW", or "NONE"
     */
    function resolveMarket(
        uint256 _matchId,
        uint256 _marketIndex,
        string memory _winner
    )
        external
        validMarketIndex(_matchId, _marketIndex)
    {
        MatchMarket storage market = marketsByMatchId[_matchId][_marketIndex];

        require(!market.resolved, "Market already resolved");
        require(_isParticipant(market, msg.sender), "Only a participant can resolve the market");

        // Mark resolved and set winner
        market.resolved = true;
        market.winner = _winner;

        // Placeholder: reward distribution logic should be invoked here.
        // Example (future):
        //  - calculate winners/pro-rata shares
        //  - distribute ETH to winners
        //  - charge platform fee to owner
        // This function currently only sets the resolution state and emits an event.
        emit MarketResolved(market.marketId, _winner, msg.sender);
    }

    /* -------------------------------------------------------------------
       View / Utility functions
       ------------------------------------------------------------------- */

    /**
     * @notice Returns all markets for a given matchId.
     * @dev Copies storage array to memory for external callers. Strings and dynamic arrays are preserved.
     * @param _matchId Match ID to query
     * @return an array of MatchMarket structs (in memory)
     */
    function getMarketsByMatch(uint256 _matchId) external view returns (MatchMarket[] memory) {
        MatchMarket[] storage arr = marketsByMatchId[_matchId];
        uint256 len = arr.length;
        MatchMarket[] memory copy = new MatchMarket[](len);

        for (uint256 i = 0; i < len; i++) {
            MatchMarket storage s = arr[i];

            // copy storage struct to memory struct
            address[] memory parts = new address[](s.participants.length);
            for (uint256 j = 0; j < s.participants.length; j++) {
                parts[j] = s.participants[j];
            }

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
            copy[i].participants = parts;
        }

        return copy;
    }

    /**
     * @notice Returns marketIds created by a user.
     * @param _user Address of the user
     * @return Array of marketIds
     */
    function getUserMarkets(address _user) external view returns (uint256[] memory) {
        return userMarkets[_user];
    }

    /**
     * @notice Returns number of markets for a given matchId.
     * @param _matchId Match ID
     * @return length number of markets
     */
    function marketsCountForMatch(uint256 _matchId) external view returns (uint256 length) {
        return marketsByMatchId[_matchId].length;
    }

    /**
     * @notice Returns participants for a specific market.
     * @param _matchId Match ID
     * @param _marketIndex Index within match markets array
     * @return array of participant addresses
     */
    function getParticipants(uint256 _matchId, uint256 _marketIndex)
        external
        view
        validMarketIndex(_matchId, _marketIndex)
        returns (address[] memory)
    {
        return marketsByMatchId[_matchId][_marketIndex].participants;
    }

    /* -------------------------------------------------------------------
       Admin / Owner utilities (for future operations)
       ------------------------------------------------------------------- */

    /**
     * @notice Withdraw collected ETH from the contract to owner. (Admin convenience)
     * @dev Only owner can call. In future this should be replaced by explicit fee accounting per market.
     * @param _to Recipient address
     * @param _amount Amount in wei to withdraw
     */
    function adminWithdraw(address payable _to, uint256 _amount) external onlyOwner nonReentrant {
        require(_to != address(0), "Invalid address");
        require(address(this).balance >= _amount, "Insufficient balance");
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Transfer failed");
    }

    /**
     * @notice Fallback receive to accept ETH
     * @dev Contract currently holds participant payments. Future logic should segregate funds per market.
     */
    receive() external payable {}

    fallback() external payable {}
}
