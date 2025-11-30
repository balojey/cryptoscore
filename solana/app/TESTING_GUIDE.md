# End-to-End Testing Guide for Anchor-Free Solana Integration

This guide provides step-by-step instructions for manually testing the Anchor-free Solana integration on devnet.

## Prerequisites

Before starting the tests, ensure you have:

1. **Solana Programs Deployed on Devnet**
   - Factory program deployed and initialized
   - Market program deployed
   - Program IDs updated in `src/config/programs.ts`

2. **Wallet Setup**
   - Phantom, Solflare, or another Solana wallet installed
   - Wallet configured for devnet
   - At least 2-3 SOL in devnet (get from https://faucet.solana.com/)

3. **Development Environment**
   - Application running locally: `npm run dev`
   - Browser console open for debugging
   - Network tab open to monitor transactions

## Test 7.2: Market Creation Flow End-to-End

### Objective
Verify that users can create prediction markets and that market accounts are created on-chain.

### Test Steps

#### 1. Connect Wallet
- [ ] Open the application in your browser
- [ ] Click "Connect Wallet" button
- [ ] Select your wallet (Phantom/Solflare)
- [ ] Approve the connection
- [ ] Verify wallet address displays in header
- [ ] Verify SOL balance displays correctly

#### 2. Create Market with Valid Parameters
- [ ] Navigate to market creation page/modal
- [ ] Fill in market details:
  - Match ID: `test_match_001`
  - Entry Fee: `0.1 SOL` (100000000 lamports)
  - Kickoff Time: 1 hour from now
  - End Time: 3 hours from now
  - Visibility: Public
- [ ] Click "Create Market" button
- [ ] Verify fee estimation displays (should show ~0.00001 SOL)
- [ ] Verify transaction simulation runs successfully
- [ ] Approve transaction in wallet
- [ ] Wait for confirmation (should take 5-15 seconds)

#### 3. Verify Market Account Created
- [ ] Check browser console for:
  - Factory PDA address
  - Market PDA address
  - Transaction signature
- [ ] Copy transaction signature
- [ ] Open Solana Explorer: https://explorer.solana.com/?cluster=devnet
- [ ] Paste transaction signature and verify:
  - Transaction succeeded
  - Correct program ID
  - Correct accounts involved
- [ ] Navigate to market PDA address in explorer
- [ ] Verify account exists and has data

#### 4. Verify UI Updates
- [ ] Check that success toast appears: "Market created successfully!"
- [ ] Verify new market appears in markets list
- [ ] Verify market details are correct:
  - Match ID matches input
  - Entry fee matches input
  - Times are correct
  - Status is "Open"
  - Participant count is 0
  - Total pool is 0

#### 5. Test Error Scenarios

**Insufficient Funds:**
- [ ] Try creating market with entry fee > wallet balance
- [ ] Verify error message: "Insufficient SOL balance for this transaction"
- [ ] Verify transaction is not sent

**Invalid Parameters:**
- [ ] Try creating market with kickoff time in the past
- [ ] Verify simulation fails or transaction reverts
- [ ] Verify user-friendly error message displays

**Duplicate Match ID:**
- [ ] Try creating market with same match ID as existing market
- [ ] Verify error message about duplicate market
- [ ] Verify transaction fails gracefully

**User Rejection:**
- [ ] Start market creation
- [ ] Reject transaction in wallet
- [ ] Verify error message: "Transaction was rejected by wallet"
- [ ] Verify no transaction is sent

### Expected Results
- ✅ Market creation succeeds with valid parameters
- ✅ Market account is created on-chain with correct data
- ✅ UI updates immediately after confirmation
- ✅ Error scenarios are handled gracefully with clear messages
- ✅ Transaction signatures are logged and accessible

---

## Test 7.3: Market Joining Flow End-to-End

### Objective
Verify that users can join markets with predictions and that participant accounts are created.

### Test Steps

#### 1. Join Market with HOME Prediction
- [ ] Navigate to an open market (created in Test 7.2)
- [ ] Verify market status is "Open"
- [ ] Verify kickoff time hasn't passed
- [ ] Click "Join Market" button
- [ ] Select prediction: "HOME"
- [ ] Verify entry fee displays correctly
- [ ] Verify fee estimation displays
- [ ] Verify transaction simulation succeeds
- [ ] Approve transaction in wallet
- [ ] Wait for confirmation

#### 2. Verify Participant Account Created
- [ ] Check browser console for:
  - Participant PDA address
  - Transaction signature
- [ ] Open transaction in Solana Explorer
- [ ] Verify transaction succeeded
- [ ] Navigate to participant PDA address
- [ ] Verify account exists with correct data:
  - Market address matches
  - User address matches wallet
  - Prediction is 0 (HOME)
  - hasWithdrawn is false

#### 3. Verify Market Updates
- [ ] Verify market participant count increased by 1
- [ ] Verify market homeCount increased by 1
- [ ] Verify market totalPool increased by entry fee
- [ ] Verify UI shows "Joined" status
- [ ] Verify user's prediction displays correctly

#### 4. Test DRAW Prediction (with second wallet)
- [ ] Switch to a different wallet or use second browser
- [ ] Connect wallet
- [ ] Join the same market
- [ ] Select prediction: "DRAW"
- [ ] Approve and confirm transaction
- [ ] Verify drawCount increased
- [ ] Verify participant count increased

#### 5. Test AWAY Prediction (with third wallet)
- [ ] Switch to a third wallet
- [ ] Join the same market
- [ ] Select prediction: "AWAY"
- [ ] Approve and confirm transaction
- [ ] Verify awayCount increased
- [ ] Verify participant count increased

#### 6. Test Error Scenarios

**Already Joined:**
- [ ] Try joining same market again with same wallet
- [ ] Verify error: "User has already joined this market"
- [ ] Verify transaction fails

**Market Started:**
- [ ] Wait for kickoff time to pass (or create market with past kickoff)
- [ ] Try joining market
- [ ] Verify error: "Market has already started"
- [ ] Verify transaction fails

**Insufficient Funds:**
- [ ] Use wallet with less SOL than entry fee
- [ ] Try joining market
- [ ] Verify error: "Insufficient SOL balance for this transaction"
- [ ] Verify transaction is not sent

**Invalid Prediction:**
- [ ] (This should be prevented by UI, but test if possible)
- [ ] Try sending invalid prediction value
- [ ] Verify error: "Invalid prediction choice"

### Expected Results
- ✅ Users can join markets with all three prediction choices
- ✅ Participant accounts are created correctly
- ✅ Market counts update correctly (homeCount, drawCount, awayCount)
- ✅ Total pool increases by entry fee for each participant
- ✅ Error scenarios are handled gracefully
- ✅ Users cannot join same market twice

---

## Test 7.4: Market Resolution and Withdrawal Flow

### Objective
Verify that markets can be resolved and winners can withdraw rewards.

### Test Steps

#### 1. Resolve Market
- [ ] Use the market creator's wallet
- [ ] Navigate to a market with participants (from Test 7.3)
- [ ] Wait for end time to pass (or use test market with past end time)
- [ ] Click "Resolve Market" button
- [ ] Select outcome: "HOME" (or whichever has participants)
- [ ] Verify fee estimation displays
- [ ] Verify transaction simulation succeeds
- [ ] Approve transaction in wallet
- [ ] Wait for confirmation

#### 2. Verify Market Status Updates
- [ ] Check browser console for transaction signature
- [ ] Verify success toast: "Market resolved successfully!"
- [ ] Verify market status changed to "Resolved"
- [ ] Verify outcome displays correctly
- [ ] Open transaction in Solana Explorer
- [ ] Verify transaction succeeded
- [ ] Verify market account data updated:
  - Status is 2 (Resolved)
  - Outcome matches selection

#### 3. Withdraw Rewards as Winner
- [ ] Switch to a wallet that made the winning prediction
- [ ] Navigate to the resolved market
- [ ] Verify "Withdraw" button is enabled
- [ ] Verify estimated reward amount displays
- [ ] Click "Withdraw" button
- [ ] Verify fee estimation displays
- [ ] Verify transaction simulation succeeds
- [ ] Approve transaction in wallet
- [ ] Wait for confirmation

#### 4. Verify SOL Transfer
- [ ] Check browser console for transaction signature
- [ ] Verify success toast: "🎉 Rewards withdrawn successfully!"
- [ ] Note wallet balance before and after
- [ ] Calculate expected reward:
  - Total pool = entry fee × participant count
  - Creator fee = total pool × 0.01
  - Platform fee = total pool × 0.01
  - Winner pool = total pool - creator fee - platform fee
  - Per winner = winner pool / winner count
- [ ] Verify wallet balance increased by expected amount
- [ ] Open transaction in Solana Explorer
- [ ] Verify SOL transfer occurred
- [ ] Verify participant account updated:
  - hasWithdrawn is true

#### 5. Test Error Scenarios

**Not a Winner:**
- [ ] Switch to wallet that made losing prediction
- [ ] Try withdrawing from resolved market
- [ ] Verify error: "User is not a winner"
- [ ] Verify transaction fails

**Already Withdrawn:**
- [ ] Try withdrawing again with same winning wallet
- [ ] Verify error: "Rewards already withdrawn"
- [ ] Verify transaction fails

**Market Not Resolved:**
- [ ] Try withdrawing from unresolved market
- [ ] Verify error or disabled button
- [ ] Verify transaction cannot be sent

**Unauthorized Resolution:**
- [ ] Try resolving market with non-creator wallet
- [ ] Verify error: "Unauthorized"
- [ ] Verify transaction fails

### Expected Results
- ✅ Market creator can resolve markets
- ✅ Market status updates to "Resolved"
- ✅ Winners can withdraw rewards
- ✅ SOL transfers correctly to winners
- ✅ Withdrawal amount is calculated correctly
- ✅ Users cannot withdraw twice
- ✅ Non-winners cannot withdraw
- ✅ Error scenarios are handled gracefully

---

## Test 7.5: Real-Time Updates via WebSocket

### Objective
Verify that the UI updates automatically when account data changes.

### Test Steps

#### 1. Setup for Real-Time Testing
- [ ] Open application in two browser windows/tabs
- [ ] Connect different wallets in each window
- [ ] Navigate both to the same market detail page
- [ ] Open browser console in both windows

#### 2. Subscribe to Market Account Changes
- [ ] Verify WebSocket connection established (check console)
- [ ] Verify subscription to market account (check console logs)
- [ ] Note current market data in both windows

#### 3. Trigger Updates from Another Wallet
- [ ] In Window 1: Join the market
- [ ] Wait for transaction confirmation
- [ ] In Window 2: Observe automatic UI update
- [ ] Verify in Window 2:
  - Participant count increased
  - Prediction distribution updated
  - Total pool increased
  - No page refresh required
  - Update happened within 1-2 seconds

#### 4. Test Multiple Update Types
- [ ] Have Window 1 join market → verify Window 2 updates
- [ ] Have Window 2 join market → verify Window 1 updates
- [ ] Resolve market in Window 1 → verify Window 2 shows "Resolved"
- [ ] Withdraw in Window 1 → verify Window 2 updates participant data

#### 5. Test WebSocket Reconnection
- [ ] Open browser DevTools Network tab
- [ ] Simulate network disconnection (throttle to offline)
- [ ] Wait 5 seconds
- [ ] Restore network connection
- [ ] Verify WebSocket reconnects automatically
- [ ] Verify data syncs after reconnection
- [ ] Make a change in another window
- [ ] Verify update is received after reconnection

#### 6. Test Component Unmount
- [ ] Navigate to market detail page
- [ ] Verify subscription established
- [ ] Navigate away from page
- [ ] Check console for unsubscribe message
- [ ] Verify no memory leaks (check browser memory profiler)

### Expected Results
- ✅ WebSocket connection establishes automatically
- ✅ UI updates automatically when account data changes
- ✅ Updates appear within 1-2 seconds
- ✅ No page refresh required
- ✅ Multiple windows stay in sync
- ✅ WebSocket reconnects after disconnection
- ✅ Subscriptions clean up on component unmount
- ✅ No memory leaks or performance issues

---

## Testing Checklist Summary

### Task 7.2: Market Creation ✅
- [ ] Connect wallet successfully
- [ ] Create market with valid parameters
- [ ] Verify market account on-chain
- [ ] Verify UI updates correctly
- [ ] Test insufficient funds error
- [ ] Test invalid parameters error
- [ ] Test user rejection error

### Task 7.3: Market Joining ✅
- [ ] Join with HOME prediction
- [ ] Join with DRAW prediction
- [ ] Join with AWAY prediction
- [ ] Verify participant accounts created
- [ ] Verify market counts update
- [ ] Test already joined error
- [ ] Test market started error
- [ ] Test insufficient funds error

### Task 7.4: Resolution & Withdrawal ✅
- [ ] Resolve market as creator
- [ ] Verify market status updates
- [ ] Withdraw as winner
- [ ] Verify SOL transfer
- [ ] Test not a winner error
- [ ] Test already withdrawn error
- [ ] Test unauthorized resolution error

### Task 7.5: Real-Time Updates ✅
- [ ] Subscribe to account changes
- [ ] Verify automatic UI updates
- [ ] Test multiple update types
- [ ] Test WebSocket reconnection
- [ ] Verify cleanup on unmount

---

## Troubleshooting

### Transaction Fails with "Simulation Failed"
- Check program is deployed on devnet
- Verify program IDs in config match deployed programs
- Check account has sufficient SOL
- Review transaction logs in console

### WebSocket Not Connecting
- Check network connectivity
- Verify RPC endpoint supports WebSocket
- Check browser console for errors
- Try different RPC endpoint

### UI Not Updating
- Check React Query cache settings
- Verify query invalidation after mutations
- Check browser console for errors
- Refresh page and try again

### Account Not Found
- Verify PDA derivation is correct
- Check program ID matches deployed program
- Verify account was created successfully
- Check Solana Explorer for account data

---

## Test Results Template

Use this template to document your test results:

```
## Test Execution Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** Devnet
**Wallet:** [Wallet Address]

### Task 7.2: Market Creation
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]
- Issues: [Any issues encountered]

### Task 7.3: Market Joining
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]
- Issues: [Any issues encountered]

### Task 7.4: Resolution & Withdrawal
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]
- Issues: [Any issues encountered]

### Task 7.5: Real-Time Updates
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]
- Issues: [Any issues encountered]

### Overall Assessment
- All tests passed: ✅ YES / ❌ NO
- Critical issues: [List any critical issues]
- Recommendations: [Any recommendations]
```

---

## Next Steps

After completing all tests:

1. Document any issues found
2. Create bug reports for failures
3. Update implementation if needed
4. Re-test after fixes
5. Mark tasks as complete in tasks.md
6. Proceed to Task 8: Documentation and cleanup
