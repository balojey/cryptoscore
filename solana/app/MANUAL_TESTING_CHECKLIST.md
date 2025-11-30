# Manual Testing Quick Checklist

Quick reference for executing manual end-to-end tests. See `TESTING_GUIDE.md` for detailed instructions.

## Pre-Testing Setup

- [ ] Programs deployed to devnet
- [ ] Program IDs updated in `src/config/programs.ts`
- [ ] Wallet(s) funded with 2-3 SOL on devnet
- [ ] Application running: `npm run dev`
- [ ] Browser console open
- [ ] Solana Explorer open: https://explorer.solana.com/?cluster=devnet

---

## Test 7.2: Market Creation (15 min)

### Happy Path
- [ ] Connect wallet
- [ ] Create market with valid params
- [ ] Verify transaction in explorer
- [ ] Verify market appears in UI
- [ ] Check market data is correct

### Error Cases
- [ ] Test insufficient funds
- [ ] Test invalid parameters
- [ ] Test user rejection
- [ ] Test duplicate match ID

**Pass Criteria:** Market created successfully, errors handled gracefully

---

## Test 7.3: Market Joining (20 min)

### Happy Path
- [ ] Join market with HOME prediction
- [ ] Verify participant account created
- [ ] Verify market counts updated
- [ ] Join with DRAW (different wallet)
- [ ] Join with AWAY (different wallet)

### Error Cases
- [ ] Test already joined
- [ ] Test market started
- [ ] Test insufficient funds

**Pass Criteria:** All predictions work, counts update, errors handled

---

## Test 7.4: Resolution & Withdrawal (15 min)

### Happy Path
- [ ] Resolve market as creator
- [ ] Verify status updates to "Resolved"
- [ ] Withdraw as winner
- [ ] Verify SOL received
- [ ] Check participant marked as withdrawn

### Error Cases
- [ ] Test non-winner withdrawal
- [ ] Test double withdrawal
- [ ] Test unauthorized resolution

**Pass Criteria:** Winners receive correct SOL, errors handled

---

## Test 7.5: Real-Time Updates (10 min)

### Happy Path
- [ ] Open two browser windows
- [ ] Connect different wallets
- [ ] Navigate to same market
- [ ] Join in window 1
- [ ] Verify window 2 updates automatically
- [ ] Test multiple update types

### Reconnection
- [ ] Simulate network disconnect
- [ ] Restore connection
- [ ] Verify reconnection works
- [ ] Verify data syncs

**Pass Criteria:** UI updates automatically, reconnection works

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Run unit tests
npm test

# Check program IDs
cat src/config/programs.ts

# Get devnet SOL
# Visit: https://faucet.solana.com/
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Transaction fails | Check program deployed, IDs correct |
| Insufficient funds | Get more SOL from faucet |
| WebSocket not connecting | Try different RPC endpoint |
| UI not updating | Check React Query cache, refresh page |
| Account not found | Verify PDA derivation, check explorer |

---

## Test Results

Mark each test as you complete it:

- [ ] 7.2 Market Creation - PASS / FAIL
- [ ] 7.3 Market Joining - PASS / FAIL
- [ ] 7.4 Resolution & Withdrawal - PASS / FAIL
- [ ] 7.5 Real-Time Updates - PASS / FAIL

**All tests passed:** ✅ YES / ❌ NO

**Issues found:** _____________________

**Time taken:** _____ minutes

---

## After Testing

1. Document any issues in GitHub/project tracker
2. Update `tasks.md` to mark tests complete
3. Proceed to Task 8: Documentation and cleanup
4. Celebrate! 🎉

---

**Need help?** See `TESTING_GUIDE.md` for detailed instructions and troubleshooting.
