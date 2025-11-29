# CryptoScore Solana - Deployment Checklist

## Pre-Deployment

### 1. Program Deployment
- [ ] Build all programs: `anchor build`
- [ ] Deploy Factory program: `anchor deploy --program-name cryptoscore_factory`
- [ ] Deploy Market program: `anchor deploy --program-name cryptoscore_market`
- [ ] Deploy Dashboard program: `anchor deploy --program-name cryptoscore_dashboard`
- [ ] Note all program IDs from deployment output
- [ ] Verify programs on Solana Explorer

### 2. Initialize Programs
- [ ] Initialize Factory with platform fee: `anchor run initialize-factory`
- [ ] Verify Factory account created
- [ ] Test create market instruction
- [ ] Test join market instruction
- [ ] Test resolve market instruction
- [ ] Test withdraw rewards instruction

### 3. Frontend Configuration
- [ ] Copy IDL files: `npm run copy-idls`
- [ ] Update `.env` with program IDs:
  ```env
  VITE_FACTORY_PROGRAM_ID=<factory_program_id>
  VITE_MARKET_PROGRAM_ID=<market_program_id>
  VITE_DASHBOARD_PROGRAM_ID=<dashboard_program_id>
  VITE_SOLANA_NETWORK=devnet
  VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
  ```
- [ ] Install dependencies: `npm install`
- [ ] Build frontend: `npm run build`
- [ ] Test production build: `npm run preview`

## Testing

### 4. Wallet Connection
- [ ] Connect Phantom wallet
- [ ] Connect Solflare wallet
- [ ] Connect Backpack wallet
- [ ] Verify wallet balance displays
- [ ] Test wallet disconnect/reconnect

### 5. Market Creation
- [ ] Navigate to "Create Market"
- [ ] Select competition (Premier League)
- [ ] Select date range (Today)
- [ ] Choose a match
- [ ] Set entry fee (0.1 SOL)
- [ ] Toggle public/private
- [ ] Click "Create Market"
- [ ] Approve transaction in wallet
- [ ] Verify transaction on Explorer
- [ ] Verify market appears in "My Markets"
- [ ] Verify market appears in "Open Markets"

### 6. Market Joining
- [ ] Switch to different wallet
- [ ] Browse public markets
- [ ] Click on a market card
- [ ] Select prediction (HOME/DRAW/AWAY)
- [ ] Click "Join Market"
- [ ] Approve transaction
- [ ] Verify transaction on Explorer
- [ ] Verify prediction saved
- [ ] Verify participant count increased

### 7. Market Resolution
- [ ] Switch back to creator wallet
- [ ] Navigate to "My Markets"
- [ ] Find market that has ended
- [ ] Click "Resolve Market"
- [ ] Select actual outcome
- [ ] Approve transaction
- [ ] Verify transaction on Explorer
- [ ] Verify market status changed to "Resolved"
- [ ] Verify outcome displayed correctly

### 8. Reward Withdrawal
- [ ] Switch to winner wallet
- [ ] Navigate to "My Markets"
- [ ] Find resolved market where you won
- [ ] Click "Withdraw Rewards"
- [ ] Approve transaction
- [ ] Verify transaction on Explorer
- [ ] Verify SOL received in wallet
- [ ] Verify "Already Withdrawn" message appears

### 9. User Statistics
- [ ] Navigate to user profile/dashboard
- [ ] Verify total markets count
- [ ] Verify wins/losses count
- [ ] Verify total wagered amount
- [ ] Verify total won amount
- [ ] Verify current streak
- [ ] Verify best streak

### 10. Filtering & Sorting
- [ ] Test status filter (All, Open, Live, Resolved)
- [ ] Test time range filter (All Time, Today, This Week, This Month)
- [ ] Test pool size filter
- [ ] Test entry fee filter
- [ ] Test sort by newest
- [ ] Test sort by ending soon
- [ ] Test sort by highest pool
- [ ] Test sort by most participants

### 11. Pagination
- [ ] Create 20+ markets
- [ ] Verify pagination controls appear
- [ ] Click "Next" button
- [ ] Verify page 2 loads
- [ ] Click "Previous" button
- [ ] Verify page 1 loads
- [ ] Test page number display

### 12. Virtual Scrolling
- [ ] Create 30+ markets
- [ ] Verify virtual scrolling activates
- [ ] Scroll through market list
- [ ] Verify smooth performance
- [ ] Verify all markets render correctly

### 13. Real-Time Updates
- [ ] Open app in two browser windows
- [ ] Create market in window 1
- [ ] Verify market appears in window 2 (within 10 seconds)
- [ ] Join market in window 2
- [ ] Verify participant count updates in window 1
- [ ] Resolve market in window 1
- [ ] Verify status updates in window 2

### 14. Error Handling
- [ ] Try creating market with 0 entry fee (should fail)
- [ ] Try joining market without enough SOL (should fail)
- [ ] Try resolving market before it ends (should fail)
- [ ] Try resolving market as non-creator (should fail)
- [ ] Try withdrawing rewards as non-winner (should fail)
- [ ] Try withdrawing rewards twice (should fail)
- [ ] Verify all errors show user-friendly messages

### 15. Mobile Responsiveness
- [ ] Test on mobile device (or DevTools mobile view)
- [ ] Verify layout adapts correctly
- [ ] Test wallet connection on mobile
- [ ] Test market creation on mobile
- [ ] Test market joining on mobile
- [ ] Verify all buttons are tappable
- [ ] Verify text is readable

### 16. Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on Brave
- [ ] Verify consistent behavior

## Performance

### 17. Load Times
- [ ] Measure initial page load (<3 seconds)
- [ ] Measure market list load (<2 seconds)
- [ ] Measure market detail load (<1 second)
- [ ] Measure transaction confirmation (<5 seconds)

### 18. RPC Calls
- [ ] Monitor RPC call frequency
- [ ] Verify caching working (no duplicate calls)
- [ ] Verify polling interval (10 seconds)
- [ ] Check for rate limiting issues

### 19. Memory Usage
- [ ] Open DevTools Performance tab
- [ ] Record session with multiple actions
- [ ] Check for memory leaks
- [ ] Verify garbage collection working

## Security

### 20. Wallet Security
- [ ] Verify no private keys in code
- [ ] Verify no private keys in localStorage
- [ ] Verify transaction preview before signing
- [ ] Verify wallet disconnect clears state

### 21. Input Validation
- [ ] Test negative entry fees (should reject)
- [ ] Test extremely large entry fees (should handle)
- [ ] Test invalid match IDs (should reject)
- [ ] Test invalid timestamps (should reject)

### 22. PDA Security
- [ ] Verify PDAs derived correctly
- [ ] Verify no hardcoded addresses
- [ ] Verify program IDs from environment
- [ ] Verify account ownership checks

## Documentation

### 23. Code Documentation
- [ ] All functions have JSDoc comments
- [ ] All complex logic has inline comments
- [ ] All types are properly documented
- [ ] README is up to date

### 24. User Documentation
- [ ] Quick start guide complete
- [ ] Integration guide complete
- [ ] Deployment checklist complete
- [ ] Troubleshooting guide available

## Production Deployment

### 25. Environment Setup
- [ ] Set production RPC URL
- [ ] Set production program IDs
- [ ] Set production network (mainnet-beta)
- [ ] Configure production API keys

### 26. Build & Deploy
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Deploy to hosting (Vercel/Netlify/etc.)
- [ ] Verify deployment successful
- [ ] Test deployed app

### 27. Monitoring
- [ ] Set up error tracking (Sentry/etc.)
- [ ] Set up analytics (Google Analytics/etc.)
- [ ] Set up uptime monitoring
- [ ] Set up RPC monitoring
- [ ] Set up transaction monitoring

### 28. Post-Deployment
- [ ] Announce launch
- [ ] Monitor for errors
- [ ] Monitor user feedback
- [ ] Monitor transaction volume
- [ ] Monitor RPC usage

## Rollback Plan

### 29. Backup
- [ ] Backup program IDs
- [ ] Backup IDL files
- [ ] Backup environment variables
- [ ] Backup deployment configuration

### 30. Rollback Procedure
- [ ] Document rollback steps
- [ ] Test rollback procedure
- [ ] Prepare rollback scripts
- [ ] Assign rollback responsibility

## Sign-Off

- [ ] Development team approval
- [ ] QA team approval
- [ ] Security team approval
- [ ] Product owner approval
- [ ] Ready for production deployment

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Program IDs**:
- Factory: _______________
- Market: _______________
- Dashboard: _______________

**Frontend URL**: _______________

**Notes**: _______________
