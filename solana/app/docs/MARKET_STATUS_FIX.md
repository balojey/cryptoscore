# Market Status and Withdraw Button Fixes

## Changes Made

### 1. Market Status: "Unresolved" State

**Problem:** After a match ended, markets were showing "Live" status instead of indicating they need resolution.

**Solution:** Added a new "Unresolved" status that displays when:
- Match status is 'FINISHED' (from Football-Data API)
- Market has not been resolved yet (resolved = false)

**Files Modified:**
- `src/components/cards/EnhancedMarketCard.tsx` - Updated `StatusBadge` component
- `src/pages/MarketDetail.tsx` - Updated `getStatusBadge` function

**Status Flow:**
1. **Open** - Before match starts (>2 hours)
2. **Ending Soon** - Less than 2 hours until match starts
3. **Live** - Match has started but not finished
4. **Unresolved** - Match finished but market not resolved (NEW)
5. **Resolved** - Market has been resolved with winner

### 2. Withdraw Button: Winners Only

**Problem:** All participants could see the withdraw button after market resolution, even if they didn't win.

**Solution:** Added winner validation logic that checks:
- User is a participant
- User made a prediction (not 'NONE')
- User's prediction matches the winning outcome:
  - winningTeam === 1 && prediction === 'HOME'
  - winningTeam === 2 && prediction === 'AWAY'
  - winningTeam === 3 && prediction === 'DRAW'

**Files Modified:**
- `src/pages/MarketDetail.tsx` - Updated `renderButtons` function

**Logic:**
```typescript
const userIsWinner = isUserParticipant && predictionName !== 'NONE' && (
  (winningTeam === 1 && predictionName === 'HOME') ||
  (winningTeam === 2 && predictionName === 'AWAY') ||
  (winningTeam === 3 && predictionName === 'DRAW')
)
```

### 3. Prevent Double Withdrawals

**Problem:** Users could see the withdraw button even after they've already withdrawn their rewards.

**Solution:** Added reward balance check that reads from the smart contract's `rewards` mapping:
- Fetch user's reward balance using `useReadContract` with `rewards` function
- Only show withdraw button if `userRewardBalance > 0`
- Show "Withdrawn" status badge for winners who have already claimed

**Files Modified:**
- `src/pages/MarketDetail.tsx` - Added `userRewardBalance` read and updated `renderButtons` function

**Logic:**
```typescript
// Get user's reward balance to check if they've already withdrawn
const { data: userRewardBalance } = useReadContract({
  abi: CryptoScoreMarketABI,
  address: marketAddress,
  functionName: 'rewards',
  args: [userAddress!],
  query: { enabled: !!marketAddress && !!userAddress && marketStatus === true },
})

// Check if user has already withdrawn (reward balance is 0)
const hasRewardToWithdraw = userRewardBalance && Number(userRewardBalance) > 0
```

**UI States:**
- **Winner with rewards:** Shows green "Withdraw" button
- **Winner already withdrawn:** Shows green "Withdrawn" badge with checkmark
- **Non-winner:** No button or badge shown

## Testing Checklist

- [ ] Market shows "Open" status before match starts
- [ ] Market shows "Ending Soon" when <2 hours until start
- [ ] Market shows "Live" when match is in progress
- [ ] Market shows "Unresolved" when match finishes but not resolved
- [ ] Market shows "Resolved" after resolution
- [ ] Withdraw button only appears for winning participants
- [ ] Withdraw button does not appear for losing participants
- [ ] Withdraw button does not appear for non-participants
- [ ] Withdraw button disappears after successful withdrawal
- [ ] "Withdrawn" badge appears for winners who already claimed
- [ ] Non-winners never see withdraw button or withdrawn badge

## User Experience Improvements

1. **Clear Status Communication:** Users can now easily identify markets that need resolution
2. **Prevent Confusion:** Non-winners won't see a withdraw button they can't use
3. **Better UX:** Winners get clear visual feedback that they can claim rewards
4. **Status Accuracy:** Market status accurately reflects the current state
5. **Prevent Double Withdrawals:** Users can't accidentally try to withdraw twice
6. **Clear Withdrawal Status:** Winners see confirmation that they've already claimed their rewards

## Technical Details

### Status Badge Colors
- **Open** - Blue (info)
- **Ending Soon** - Red (error) with pulse animation
- **Live** - Yellow (warning)
- **Unresolved** - Yellow (warning)
- **Resolved** - Green (success)

### Winner Determination
The winner is determined by comparing:
- `winningTeam` (from smart contract, set during resolution)
- `predictionName` (from `useUserPrediction` hook)

Values:
- 0 = NONE (no prediction)
- 1 = HOME
- 2 = AWAY
- 3 = DRAW

---

**Date:** 2024-11-24
**Status:** ✅ Complete
