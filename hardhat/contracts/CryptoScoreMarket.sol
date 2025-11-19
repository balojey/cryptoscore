// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CryptoScoreMarket - Decentralized market with participant-based resolution
contract CryptoScoreMarket {
    enum Prediction { NONE, HOME, AWAY, DRAW }

    address public creator;
    address public factory;
    uint256 public matchId;
    uint256 public entryFee;
    bool public resolved;
    Prediction public winner;

    // New features
    bool public isPublic;        // True if market is public, false if private
    uint256 public startTime;    // UNIX timestamp for match start

    // Prediction tracking
    uint256 public homeCount;    // Number of HOME predictions
    uint256 public awayCount;    // Number of AWAY predictions
    uint256 public drawCount;    // Number of DRAW predictions

    mapping(address => Prediction) public predictions;
    mapping(address => uint256) public rewards;
    address[] public participants;

    event Joined(address indexed user, Prediction prediction);
    event Resolved(Prediction winner, address indexed resolvedBy);
    event RewardAssigned(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    modifier onlyParticipant() {
        require(predictions[msg.sender] != Prediction.NONE, "Not a participant");
        _;
    }

    constructor(
        address _creator,
        uint256 _matchId,
        uint256 _entryFee,
        bool _isPublic,
        uint256 _startTime
    ) {
        factory = msg.sender;
        creator = _creator;
        matchId = _matchId;
        entryFee = _entryFee;
        isPublic = _isPublic;
        startTime = _startTime;
    }

    /// @notice Join the market with a prediction
    function join(Prediction _prediction) external payable {
        require(!resolved, "Market resolved");
        require(block.timestamp < startTime, "Match already started");
        require(_prediction != Prediction.NONE, "Invalid prediction");
        require(predictions[msg.sender] == Prediction.NONE, "Already joined");
        require(msg.value == entryFee, "Incorrect fee");

        predictions[msg.sender] = _prediction;
        participants.push(msg.sender);

        // Update prediction counts
        if (_prediction == Prediction.HOME) {
            homeCount++;
        } else if (_prediction == Prediction.AWAY) {
            awayCount++;
        } else if (_prediction == Prediction.DRAW) {
            drawCount++;
        }

        emit Joined(msg.sender, _prediction);
    }

    /// @notice Resolve the market and distribute rewards
    function resolve(Prediction _winner) external onlyParticipant {
        require(!resolved, "Already resolved");
        require(_winner != Prediction.NONE, "Invalid winner");
        resolved = true;
        winner = _winner;

        uint256 totalPool = address(this).balance;
        uint256 winnerCount = 0;

        // Count winners
        for (uint256 i = 0; i < participants.length; i++) {
            if (predictions[participants[i]] == winner) {
                winnerCount++;
            }
        }

        if (winnerCount == 0) {
            emit Resolved(_winner, msg.sender);
            return;
        }

        uint256 sharePerWinner = totalPool / winnerCount;

        for (uint256 i = 0; i < participants.length; i++) {
            address player = participants[i];
            if (predictions[player] == winner) {
                uint256 creatorCut = (sharePerWinner * 1) / 100;
                uint256 platformCut = (sharePerWinner * 1) / 100;
                uint256 finalAmount = sharePerWinner - creatorCut - platformCut;

                rewards[player] += finalAmount;
                rewards[creator] += creatorCut;
                rewards[factory] += platformCut;

                emit RewardAssigned(player, finalAmount);
            }
        }

        emit Resolved(_winner, msg.sender);
    }

    function withdraw() external {
        uint256 amount = rewards[msg.sender];
        require(amount > 0, "No reward to withdraw");

        rewards[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function getParticipantsCount() external view returns (uint256) {
        return participants.length;
    }

    function isParticipant(address user) external view returns (bool) {
        return predictions[user] != Prediction.NONE;
    }

    /// @notice Get user's prediction for this market
    /// @param user The address to check
    /// @return The user's prediction (NONE if not participated)
    function getUserPrediction(address user) external view returns (Prediction) {
        return predictions[user];
    }

    /// @notice Get prediction counts for all outcomes
    /// @return home Number of HOME predictions
    /// @return away Number of AWAY predictions
    /// @return draw Number of DRAW predictions
    function getPredictionCounts() external view returns (uint256 home, uint256 away, uint256 draw) {
        return (homeCount, awayCount, drawCount);
    }
}
