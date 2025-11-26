# Withdrawal Flow - User States

## Overview
This document describes the different UI states users will see based on their participation and withdrawal status in resolved markets.

## User States

### 1. Non-Participant
**Condition:** User did not join the market
**UI Display:** 
- "Resolved" button (disabled, gray)
- No withdraw button
- No status badge

### 2. Participant - Lost (Wrong Prediction)
**Condition:** User joined but their prediction didn't match the winning outcome
**UI Display:**
- "Resolved" button (disabled, gray)
- No withdraw button
- No status badge

**Example:**
- User predicted: HOME
- Actual winner: AWAY
- Result: No rewards, no withdraw option

### 3. Participant - Won (Correct Prediction, Not Withdrawn)
**Condition:** User's prediction matches winning outcome AND has reward balance > 0
**UI Display:**
- "Resolved" button (disabled, gray)
- "Withdraw" button (green, clickable)
- Shows reward amount available

**Example:**
- User predicted: HOME
- Actual winner: HOME
- Reward balance: 5.5 PAS
- Result: Can withdraw rewards

### 4. Participant - Won (Already Withdrawn)
**Condition:** User's prediction matches winning outcome BUT reward balance = 0
**UI Display:**
- "Resolved" button (disabled, gray)
- "Withdrawn" badge (green with checkmark icon)
- No withdraw button

**Example:**
- User predicted: HOME
- Actual winner: HOME
- Reward balance: 0 PAS
- Result: Already claimed, shows confirmation

## Technical Implementation

### Smart Contract Check
```solidity
mapping(address => uint256) public rewards;

function withdraw() external {
    uint256 amount = rewards[msg.sender];
    require(amount > 0, "No reward to withdraw");
    
    rewards[msg.sender] = 0; // Set to 0 after withdrawal
    (bool sent, ) = payable(msg.sender).call{value: amount}("");
    require(sent, "Transfer failed");
}
```

### Frontend Logic
```typescript
// 1. Check if user is a winner
const userIsWinner = isUserParticipant && predictionName !== 'NONE' && (
  (winningTeam === 1 && predictionName === 'HOME') ||
  (winningTeam === 2 && predictionName === 'AWAY') ||
  (winningTeam === 3 && predictionName === 'DRAW')
)

// 2. Check if user has rewards to withdraw
const hasRewardToWithdraw = userRewardBalance && Number(userRewardBalance) > 0

// 3. Show appropriate UI
if (userIsWinner && hasRewardToWithdraw) {
  // Show withdraw button
} else if (userIsWinner && !hasRewardToWithdraw) {
  // Show "Withdrawn" badge
} else {
  // Show nothing (non-winner or non-participant)
}
```

## Flow Diagram

```
Market Resolved
    |
    ├─> User didn't join
    |   └─> Show: "Resolved" only
    |
    ├─> User joined but lost
    |   └─> Show: "Resolved" only
    |
    └─> User joined and won
        |
        ├─> rewards[user] > 0
        |   └─> Show: "Resolved" + "Withdraw" button
        |
        └─> rewards[user] = 0
            └─> Show: "Resolved" + "Withdrawn" badge
```

## Benefits

1. **Prevents Errors:** Users can't attempt to withdraw when they have no rewards
2. **Clear Feedback:** Winners know immediately if they've already claimed
3. **Gas Savings:** Prevents failed transactions from users trying to withdraw twice
4. **Better UX:** Clear visual states for all scenarios
5. **Trust Building:** Transparent reward status builds user confidence

## Edge Cases Handled

- ✅ User tries to withdraw twice (prevented by balance check)
- ✅ Non-winner tries to access withdraw (button not shown)
- ✅ Market with no winners (no one sees withdraw button)
- ✅ User checks status after withdrawal (sees "Withdrawn" badge)
- ✅ Multiple winners (each sees their own status independently)

---

**Last Updated:** 2024-11-24
**Status:** ✅ Implemented and Tested
