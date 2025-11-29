# CryptoScore Solana Frontend - Quick Start Guide

## Prerequisites

1. **Deployed Programs**: All three Solana programs must be deployed
   - CryptoScore Factory
   - CryptoScore Market
   - CryptoScore Dashboard

2. **Environment Variables**: Create `.env` file in `solana/app/` directory:
   ```env
   VITE_FACTORY_PROGRAM_ID=<your_factory_program_id>
   VITE_MARKET_PROGRAM_ID=<your_market_program_id>
   VITE_DASHBOARD_PROGRAM_ID=<your_dashboard_program_id>
   VITE_SOLANA_NETWORK=devnet
   VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

3. **IDL Files**: Copy IDL files to frontend:
   ```bash
   cd solana
   npm run copy-idls
   ```

## Installation

```bash
cd solana/app
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Key Features

### 1. Create Market
- Navigate to homepage
- Click "Create Market" button
- Select competition and date range
- Choose a match
- Set entry fee (in SOL)
- Toggle public/private
- Click "Create Market"

### 2. Join Market
- Browse public markets on homepage
- Click on a market card
- Select your prediction (HOME/DRAW/AWAY)
- Confirm transaction

### 3. Resolve Market
- Navigate to "My Markets"
- Find a market that has ended
- Click "Resolve Market" (creator only)
- Select the actual outcome
- Confirm transaction

### 4. Withdraw Rewards
- Navigate to "My Markets"
- Find a resolved market where you won
- Click "Withdraw Rewards"
- Confirm transaction

## Architecture

### Programs
- **Factory**: Creates and registers markets
- **Market**: Handles predictions and resolutions
- **Dashboard**: Provides read-only data aggregation

### Hooks
- `useSolanaProgram()`: Initializes Anchor programs
- `useMarketData()`: Fetches market details
- `useAllMarkets()`: Fetches all markets with pagination
- `useUserMarkets()`: Fetches user's markets
- `useUserStats()`: Fetches user statistics
- `useUserPrediction()`: Checks if user joined a market
- `useMarketActions()`: Provides transaction methods

### Components
- `Content.tsx`: Landing page
- `Markets.tsx`: Market creation interface
- `PublicMarkets.tsx`: Browse all public markets
- `UserMarkets.tsx`: User's active markets
- `Market.tsx`: Individual market card

## Common Issues

### Wallet Not Connected
**Error**: "Wallet not connected"
**Solution**: Click "Connect Wallet" button in header

### Transaction Failed
**Error**: "Transaction simulation failed"
**Solutions**:
- Check you have enough SOL for transaction + entry fee
- Verify market hasn't started yet (for joining)
- Verify market has ended (for resolving)
- Verify you're the creator (for resolving)
- Verify you're a winner (for withdrawing)

### Markets Not Loading
**Error**: Empty market list
**Solutions**:
- Check program IDs in `.env` are correct
- Verify programs are deployed to correct network
- Check RPC URL is accessible
- Open browser console for detailed errors

### IDL Type Errors
**Error**: TypeScript errors about program methods
**Solutions**:
- Run `npm run copy-idls` to update IDL files
- Restart TypeScript server in your IDE
- Clear `node_modules` and reinstall

## Testing

### Manual Testing Checklist
- [ ] Connect wallet
- [ ] Create a market
- [ ] View market in "My Markets"
- [ ] Join a market (with different wallet)
- [ ] View prediction in market detail
- [ ] Resolve market (after match ends)
- [ ] Withdraw rewards (as winner)
- [ ] Check user stats update
- [ ] Test filtering and sorting
- [ ] Test pagination

### Network Testing
Test on different networks:
- [ ] Localnet (local validator)
- [ ] Devnet (public testnet)
- [ ] Testnet (public testnet)
- [ ] Mainnet-beta (production)

## Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
vercel deploy
```

Make sure to set environment variables in Vercel dashboard.

## Monitoring

### Transaction Explorer
View transactions on Solana Explorer:
- Devnet: https://explorer.solana.com/?cluster=devnet
- Testnet: https://explorer.solana.com/?cluster=testnet
- Mainnet: https://explorer.solana.com/

### Program Accounts
View program accounts:
```bash
solana account <PROGRAM_ID> --url devnet
```

### Market Accounts
View market data:
```bash
solana account <MARKET_ADDRESS> --url devnet
```

## Debugging

### Enable Verbose Logging
Add to browser console:
```javascript
localStorage.setItem('debug', 'anchor:*')
```

### Check Program Logs
```bash
solana logs --url devnet
```

### Inspect Transactions
Click "View on Solana Explorer" link in transaction success messages.

## Resources

- **Anchor Docs**: https://www.anchor-lang.com/
- **Solana Docs**: https://docs.solana.com/
- **Wallet Adapter**: https://github.com/solana-labs/wallet-adapter
- **Integration Guide**: `../SOLANA_IDL_INTEGRATION.md`

## Support

For issues or questions:
1. Check this guide
2. Review integration documentation
3. Check browser console for errors
4. Verify program deployment
5. Test with Solana Explorer
