# CryptoScore Best Practices

## Development Guidelines

### Code Organization

- **Component Structure**: Organize by feature/type (cards/, charts/, layout/, market/, ui/)
- **Single Responsibility**: Each component should have one clear purpose
- **Reusability**: Extract common patterns into shared components
- **Type Safety**: Use TypeScript interfaces and types, avoid `any`
- **Naming Conventions**: PascalCase for components, camelCase for functions/variables

### React Patterns

- **Hooks First**: Use React hooks over class components
- **Custom Hooks**: Extract complex logic into custom hooks (useMatchData, useFilteredMarkets)
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Error Boundaries**: Wrap route components with error boundaries
- **Suspense**: Use Suspense for lazy-loaded routes

### State Management

- **Local State**: Use `useState` for component-specific state
- **Server State**: Use TanStack Query for API data
- **URL State**: Use React Router for navigation state
- **No Global State**: Avoid Redux/Zustand unless absolutely necessary

### Performance

- **Code Splitting**: Lazy load routes and heavy components
- **Virtual Scrolling**: Auto-activate for lists >20 items
- **Debouncing**: Debounce search and filter inputs
- **Optimistic Updates**: Show immediate feedback, validate in background
- **Image Optimization**: Use appropriate formats and sizes

### Web3 Integration

- **Wagmi Hooks**: Use `useReadContract`, `useWriteContract`, `useWatchContractEvent`
- **Error Handling**: Always handle transaction errors gracefully
- **Loading States**: Show clear loading indicators during transactions
- **Gas Estimation**: Estimate gas before transactions when possible
- **Event Listening**: Use contract events for real-time updates

### Styling

- **CSS Variables First**: ALWAYS use CSS variables for colors to support theming
- **No Hardcoded Colors**: Never use hex/rgb values directly - use `var(--bg-primary)`, `var(--text-primary)`, etc.
- **Design Tokens**: Reference tokens from `styles/tokens.css` (40+ theme-aware tokens)
- **Component Classes**: Use predefined classes from `styles/components.css` (30+ reusable classes)
- **Tailwind Utilities**: Use for layout, spacing, and non-color properties
- **Responsive**: Mobile-first approach with breakpoints (sm, md, lg, xl)
- **Theme Testing**: Test all components with all 6 theme presets
- **Inline Styles**: When using inline styles, always use CSS variables:
  ```tsx
  // ✅ Good
  <div style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
  
  // ❌ Bad
  <div style={{ background: '#252930', color: '#FFFFFF' }}>
  ```

### Accessibility

- **Semantic HTML**: Use proper HTML5 elements (header, nav, main, article, section)
- **ARIA Labels**: Add labels for screen readers on interactive elements
- **Keyboard Navigation**: Support Tab, Enter, Escape, Arrow keys
- **Focus Management**: Visible focus indicators with proper contrast
- **Color Contrast**: Maintain WCAG AA standards (4.5:1 minimum for text, 3:1 for UI components)
- **Theme Contrast**: All 6 themes maintain WCAG AA compliance
- **Reduced Motion**: Respect `prefers-reduced-motion` media query
- **Skip Links**: Provide skip to main content functionality
- **Screen Reader Text**: Use `.sr-only` class for screen reader only content

### Testing

- **Manual Testing**: Test all user flows before committing
- **Browser Testing**: Test in Chrome, Firefox, Safari
- **Mobile Testing**: Test responsive layouts
- **Wallet Testing**: Test with MetaMask and other wallets
- **Error Scenarios**: Test network errors, rejected transactions

### Git Workflow

- **Commit Messages**: Clear, descriptive messages
- **Small Commits**: Atomic commits for easier review
- **Branch Naming**: feature/, fix/, refactor/ prefixes
- **Pull Requests**: Include description and testing notes

## Smart Contract Guidelines

### Solidity Best Practices

- **Solidity Version**: Use exact version (0.8.28)
- **Gas Optimization**: Minimize storage operations
- **Event Emission**: Emit events for all state changes
- **Access Control**: Use modifiers for permission checks
- **Reentrancy**: Use checks-effects-interactions pattern
- **Integer Overflow**: Use SafeMath or Solidity 0.8+

### Polkadot Compatibility

- **No CREATE2**: Use inline deployment for PolkaVM
- **Event Indexing**: Index all searchable parameters
- **Gas Limits**: Test with Polkadot gas limits
- **Native Token**: Use PAS for testnet transactions

### Contract Architecture

- **Factory Pattern**: Use factories for contract deployment
- **Separation of Concerns**: Dashboard for reads, Markets for writes
- **Upgradability**: Consider proxy patterns for future upgrades
- **Documentation**: Comment all public functions

## API Integration

### Football-Data.org

- **API Key Rotation**: Use multiple keys to avoid rate limits
- **Error Handling**: Handle 429 (rate limit) and 404 (not found)
- **Caching**: Cache match data to reduce API calls
- **Fallback**: Show graceful errors when API is unavailable

### Real-Time Updates

- **Polling Interval**: 10 seconds for active markets
- **Cache Invalidation**: Invalidate on user actions
- **Toast Notifications**: Notify users of important updates
- **Optimistic UI**: Update UI immediately, sync in background

## Security

### Frontend Security

- **No Private Keys**: Never store private keys in frontend
- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Sanitize user-generated content
- **HTTPS Only**: Enforce secure connections
- **Environment Variables**: Use `.env` for sensitive data

### Smart Contract Security

- **Audits**: Consider audits before mainnet
- **Access Control**: Restrict sensitive functions
- **Reentrancy Guards**: Protect against reentrancy attacks
- **Integer Checks**: Prevent overflow/underflow
- **Emergency Stop**: Implement pause functionality

## Documentation

### Code Comments

- **Complex Logic**: Comment non-obvious code
- **TODOs**: Mark future improvements
- **Function Docs**: Document parameters and return values
- **Type Definitions**: Document complex types

### Project Documentation

- **README**: Keep README up to date
- **CHANGELOG**: Document major changes
- **API Docs**: Document contract interfaces
- **User Guides**: Provide user-facing documentation

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Linting clean
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Contract addresses updated
- [ ] ABIs exported and imported
- [ ] Build optimized
- [ ] PWA manifest configured

### Deployment Steps

1. Build frontend: `npm run build`
2. Test production build: `npm run preview`
3. Deploy contracts to testnet
4. Update contract addresses in config
5. Deploy frontend to hosting service
6. Test deployed application
7. Monitor for errors

### Post-Deployment

- Monitor error logs
- Check analytics
- Gather user feedback
- Plan improvements
- Document issues

## Common Pitfalls

### Avoid These Mistakes

- **Hardcoded Values**: Use config files and environment variables
- **Missing Error Handling**: Always handle errors gracefully
- **Poor Loading States**: Show clear feedback during async operations
- **Accessibility Neglect**: Test with keyboard and screen readers
- **Performance Ignorance**: Profile and optimize slow components
- **Security Oversights**: Never trust user input
- **Documentation Debt**: Document as you code, not later

### When in Doubt

- Check existing patterns in the codebase
- Refer to official documentation
- Ask for code review
- Test thoroughly
- Keep it simple
