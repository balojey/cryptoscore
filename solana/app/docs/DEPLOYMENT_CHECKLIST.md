# Solana Deployment Checklist

## Pre-Deployment

### 1. Environment Setup
- [ ] Solana CLI installed (`solana --version`)
- [ ] Anchor CLI installed (`anchor --version`)
- [ ] Wallet configured (`solana config get`)
- [ ] Sufficient SOL for deployment (~5 SOL for devnet)

### 2. Build Programs
```bash
cd solana
anchor build
```

**Verify:**
- [ ] Build completes without errors
- [ ] IDL files generated in `target/idl/`
- [ ] Program binaries in `target/deploy/`

### 3. Test Programs Locally
```bash
# Start local validator
solana-test-validator

# In another terminal
anchor test
```

**Verify:**
- [ ] All tests pass
- [ ] No runtime errors
- [ ] Expected behavior confirmed

## Deployment

### 1. Deploy to Devnet
```bash
# Set cluster to devnet
solana config set --url devnet

# Request airdrop if needed
solana airdrop 2

# Deploy programs
anchor deploy --provider.cluster devnet
```

**Record Program IDs:**
```
Factory Program ID: _______________________
Market Program ID: ________________________
Dashboard Program ID: _____________________
```

### 2. Update Frontend Configuration

#### Update `.env` file:
```env
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_FACTORY_PROGRAM_ID=<factory_program_id>
VITE_MARKET_PROGRAM_ID=<market_program_id>
VITE_DASHBOARD_PROGRAM_ID=<dashboard_program_id>
```

#### Update `src/config/programs.ts`:
- [ ] Verify program IDs match deployed programs
- [ ] Confirm network is set to devnet
- [ ] Check RPC URL is correct

### 3. Copy IDL Files
```bash
# Copy IDL files to frontend
cp target/idl/cryptoscore_factory.json app/src/idl/
cp target/idl/cryptoscore_market.json app/src/idl/
cp target/idl/cryptoscore_dashboard.json app/src/idl/
```

**Verify:**
- [ ] All 3 IDL files copied
- [ ] Files are valid JSON
- [ ] No syntax errors

### 4. Implement Program Calls

Update `app/src/hooks/useDashboardData.ts`:

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import DashboardIDL from '../idl/cryptoscore_dashboard.json'
import { DASHBOARD_PROGRAM_ID } from '../config/programs'

// Replace placeholder code with actual Anchor calls
const program = new Program(DashboardIDL, DASHBOARD_PROGRAM_ID, provider)
const markets = await program.methods
  .getMarketsDashboardPaginated(offset, limit, publicOnly)
  .accounts({ /* ... */ })
  .view()
```

**Verify:**
- [ ] Program initialization works
- [ ] Method calls succeed
- [ ] Data structure matches types
- [ ] Error handling in place

## Testing

### 1. Frontend Build
```bash
cd app
npm run build
```

**Verify:**
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Bundle size reasonable

### 2. Development Server
```bash
npm run dev
```

**Test:**
- [ ] App loads without errors
- [ ] Wallet connection works
- [ ] Dashboard displays data
- [ ] Metrics bar shows correct values
- [ ] Featured markets load
- [ ] Top movers display
- [ ] Charts render correctly
- [ ] Recent activity updates

### 3. Functional Testing

#### Data Fetching
- [ ] Markets load from Solana program
- [ ] Data refreshes every 10 seconds
- [ ] Loading states display correctly
- [ ] Empty states show when no data
- [ ] Error states handle failures gracefully

#### Currency Display
- [ ] All amounts show in SOL (not PAS)
- [ ] Decimal precision is 4 places
- [ ] Large numbers format with K/M/B
- [ ] Pool sizes calculate correctly
- [ ] Entry fees display accurately

#### Real-Time Updates
- [ ] WebSocket connects successfully
- [ ] Market updates trigger refreshes
- [ ] Toast notifications appear
- [ ] Polling fallback works
- [ ] Connection status accurate

#### User Interface
- [ ] All 6 themes work correctly
- [ ] Responsive on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] No console errors

### 4. Performance Testing
- [ ] Initial load < 3 seconds
- [ ] Virtual scrolling activates >20 markets
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] No layout shifts

### 5. Error Handling
- [ ] Network errors show friendly messages
- [ ] Retry functionality works
- [ ] Cached data displays when offline
- [ ] Program errors handled gracefully
- [ ] Wallet errors show clear messages

## Post-Deployment

### 1. Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor RPC usage
- [ ] Track transaction success rate
- [ ] Watch for program errors
- [ ] Monitor WebSocket connections

### 2. Documentation
- [ ] Update README with deployment info
- [ ] Document program IDs
- [ ] Add troubleshooting guide
- [ ] Create user guide
- [ ] Update API documentation

### 3. Backup
- [ ] Backup program keypairs
- [ ] Save deployment logs
- [ ] Document configuration
- [ ] Store IDL files
- [ ] Archive build artifacts

## Rollback Plan

If issues occur:

### 1. Immediate Actions
```bash
# Revert to previous version
git revert <commit_hash>

# Redeploy old version
npm run build
npm run deploy
```

### 2. Program Issues
- [ ] Keep old program IDs available
- [ ] Have backup RPC endpoints
- [ ] Maintain cached data
- [ ] Enable polling fallback
- [ ] Show maintenance message

### 3. Communication
- [ ] Notify users of issues
- [ ] Post status updates
- [ ] Provide ETA for fix
- [ ] Document lessons learned
- [ ] Update runbook

## Success Criteria

Deployment is successful when:

- ✅ All programs deployed to devnet
- ✅ Frontend connects to programs
- ✅ Data fetching works correctly
- ✅ Real-time updates functional
- ✅ All tests passing
- ✅ No critical errors
- ✅ Performance acceptable
- ✅ User experience smooth
- ✅ Documentation complete
- ✅ Monitoring in place

## Mainnet Preparation

Before deploying to mainnet:

### 1. Security
- [ ] Complete security audit
- [ ] Penetration testing
- [ ] Code review by team
- [ ] Test with real funds (small amounts)
- [ ] Verify upgrade authority

### 2. Performance
- [ ] Load testing completed
- [ ] RPC endpoints optimized
- [ ] Caching strategy verified
- [ ] CDN configured
- [ ] Database indexed

### 3. Legal
- [ ] Terms of service reviewed
- [ ] Privacy policy updated
- [ ] Compliance checked
- [ ] Insurance considered
- [ ] Legal counsel consulted

### 4. Operations
- [ ] 24/7 monitoring setup
- [ ] Incident response plan
- [ ] Backup systems ready
- [ ] Support team trained
- [ ] Runbooks documented

---

**Checklist Version:** 1.0  
**Last Updated:** 2024-11-28  
**Status:** Ready for Deployment
