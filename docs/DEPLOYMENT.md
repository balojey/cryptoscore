# CryptoScore Web2 Deployment Guide

This guide covers deploying CryptoScore to different environments after the web2 migration from Solana to Supabase.

## Overview

CryptoScore is now a web2 application that uses:
- **Frontend**: React TypeScript SPA
- **Backend**: Supabase PostgreSQL database
- **Authentication**: Crossmint with EVM wallet creation
- **Real-time**: Supabase real-time subscriptions

## Environment Setup

### 1. Development Environment

For local development and testing:

```bash
# Configure development environment
npm run configure:development

# Set up Supabase connection
npm run setup:supabase

# Start development server
npm run dev
```

**Required Environment Variables:**
```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
VITE_CROSSMINT_CLIENT_API_KEY=your_staging_crossmint_key
VITE_CROSSMINT_ENVIRONMENT=staging
```

### 2. Staging Environment

For testing and QA:

```bash
# Configure staging environment
npm run configure:staging

# Deploy to staging
npm run deploy:staging
```

**Required Environment Variables:**
```env
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_staging_service_key
VITE_CROSSMINT_CLIENT_API_KEY=your_staging_crossmint_key
VITE_CROSSMINT_ENVIRONMENT=staging
```

### 3. Production Environment

For live deployment:

```bash
# Configure production environment
npm run configure:production

# Deploy to production
npm run deploy:production
```

**Required Environment Variables:**
```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
VITE_CROSSMINT_CLIENT_API_KEY=your_production_crossmint_key
VITE_CROSSMINT_ENVIRONMENT=production
```

## Supabase Configuration

### 1. Create Supabase Projects

Create separate Supabase projects for each environment:

1. **Development**: For local development
2. **Staging**: For testing and QA
3. **Production**: For live application

### 2. Database Schema

Run the database migrations in each Supabase project:

```sql
-- Navigate to SQL Editor in Supabase dashboard
-- Run the migration files in order:
-- 1. app/supabase/migrations/20241219000000_initial_schema.sql
-- 2. app/supabase/migrations/20241219000001_add_creator_reward_transaction_type.sql
```

### 3. Row Level Security (RLS)

Configure RLS policies for data protection:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize as needed)
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);
```

### 4. Real-time Configuration

Enable real-time for required tables:

```sql
-- Enable real-time for markets table
ALTER PUBLICATION supabase_realtime ADD TABLE markets;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
```

## Crossmint Configuration

### 1. Create Crossmint Projects

Create separate Crossmint projects for staging and production:

1. **Staging**: For development and testing
2. **Production**: For live application

### 2. Configure EVM Wallets

Ensure Crossmint is configured for EVM wallet creation:

```javascript
// In your Crossmint console:
// 1. Set blockchain to "Ethereum" or "Polygon"
// 2. Enable social login providers (Google, Twitter, etc.)
// 3. Configure wallet creation for EVM addresses (0x format)
```

### 3. Environment-Specific Keys

Use appropriate API keys for each environment:

- **Development/Staging**: Use staging API keys
- **Production**: Use production API keys with proper domain restrictions

## Hosting Platforms

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Build Settings**:
   ```
   Build Command: npm run build
   Output Directory: app/dist
   Install Command: npm install
   ```
3. **Environment Variables**: Add all required environment variables in Vercel dashboard
4. **Deploy**: Automatic deployment on git push

### Netlify

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Configure Build Settings**:
   ```
   Build Command: npm run build
   Publish Directory: app/dist
   ```
3. **Environment Variables**: Add all required environment variables in Netlify dashboard
4. **Deploy**: Automatic deployment on git push

### GitHub Pages

1. **Build Locally**: Run `npm run build` to create `app/dist/`
2. **Deploy**: Upload `app/dist/` contents to GitHub Pages
3. **Environment Variables**: Configure in GitHub repository secrets

## Performance Optimization

### 1. Database Optimization

- **Indexes**: Ensure proper indexes on frequently queried columns
- **Connection Pooling**: Configure appropriate pool sizes
- **Query Optimization**: Use efficient queries with proper joins

### 2. Frontend Optimization

- **Code Splitting**: Vite automatically splits code for optimal loading
- **Caching**: TanStack Query provides intelligent caching
- **Bundle Analysis**: Use `npm run build` to analyze bundle size

### 3. Real-time Optimization

- **Subscription Management**: Only subscribe to necessary data
- **Event Throttling**: Configure appropriate events per second limits
- **Connection Management**: Handle reconnections gracefully

## Security Checklist

### Database Security

- [ ] RLS policies enabled on all tables
- [ ] Service role key secured and not exposed in frontend
- [ ] Database backups configured
- [ ] SSL connections enforced

### Application Security

- [ ] Environment variables properly configured
- [ ] No sensitive data in frontend code
- [ ] HTTPS enabled on hosting platform
- [ ] Content Security Policy (CSP) configured

### Authentication Security

- [ ] Crossmint configured for production environment
- [ ] EVM wallet addresses properly validated
- [ ] Session management implemented correctly
- [ ] Rate limiting configured

## Monitoring and Logging

### 1. Supabase Monitoring

- Monitor database performance in Supabase dashboard
- Set up alerts for high CPU/memory usage
- Track real-time connection counts

### 2. Application Monitoring

- Use Vercel Analytics or similar for performance monitoring
- Implement error tracking (Sentry, LogRocket, etc.)
- Monitor Core Web Vitals

### 3. User Analytics

- Track user engagement and market participation
- Monitor authentication success rates
- Analyze real-time feature usage

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure variables are prefixed with `VITE_`
   - Check that `.env` file is in the correct location
   - Verify hosting platform environment variable configuration

2. **Supabase Connection Issues**
   - Verify URL and API key are correct
   - Check network connectivity and firewall settings
   - Ensure RLS policies allow necessary operations

3. **Crossmint Authentication Issues**
   - Verify API key and environment settings
   - Check domain restrictions in Crossmint console
   - Ensure EVM wallet configuration is correct

4. **Real-time Not Working**
   - Check that real-time is enabled for required tables
   - Verify subscription patterns and event handling
   - Monitor connection status and reconnection logic

### Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Crossmint Documentation**: https://docs.crossmint.com
- **Vercel Documentation**: https://vercel.com/docs
- **Project Repository**: Check issues and discussions

## Migration Notes

This deployment guide reflects the migration from Solana web3 to Supabase web2:

### Removed Components
- All Solana program deployments
- Blockchain network configurations
- Anchor framework dependencies
- Solana wallet integrations

### New Components
- Supabase database setup
- EVM wallet configuration
- Real-time subscription management
- Web2 hosting platform deployment

### Key Benefits
- Faster deployment process (no blockchain deployment)
- Lower operational costs (no transaction fees)
- Improved user experience (no wallet connection required)
- Better scalability (traditional database scaling)