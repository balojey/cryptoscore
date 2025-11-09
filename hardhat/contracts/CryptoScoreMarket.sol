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

    constructor(address _creator, uint256 _matchId, uint256 _entryFee) {
        factory = msg.sender;
        creator = _creator;
        matchId = _matchId;
        entryFee = _entryFee;
    }

    /// @notice Join the market with a prediction
    function join(Prediction _prediction) external payable {
        require(!resolved, "Market resolved");
        require(_prediction != Prediction.NONE, "Invalid prediction");
        require(predictions[msg.sender] == Prediction.NONE, "Already joined");
        require(msg.value == entryFee, "Incorrect fee");

        predictions[msg.sender] = _prediction;
        participants.push(msg.sender);

        emit Joined(msg.sender, _prediction);
    }

    /// @notice Resolve the market and distribute rewards
    /// @dev Any participant can call this after match results are known
    ///      1% to creator and 1% to factory owner from each winner’s share
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

    /// @notice Withdraw your reward after resolution
    function withdraw() external {
        uint256 amount = rewards[msg.sender];
        require(amount > 0, "No reward to withdraw");

        rewards[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Get participant count
    function getParticipantsCount() external view returns (uint256) {
        return participants.length;
    }

    /// @notice Check if an address is a participant
    function isParticipant(address user) external view returns (bool) {
        return predictions[user] != Prediction.NONE;
    }
}
