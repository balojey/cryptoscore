# Theme System Fix - Header Background

## Issue
The header component had a hardcoded background color `rgba(11, 14, 17, 0.9)` that didn't respond to theme changes.

## Fix Applied
Changed the header background from hardcoded color to use the CSS variable:

```typescript
// Before
background: 'rgba(11, 14, 17, 0.9)'

// After
background: 'var(--bg-overlay)'
```

## Result
The header now properly responds to all theme changes. The `--bg-overlay` variable is defined for each theme with appropriate transparency (0.85 or 0.5 depending on the theme).

## Verification
- ✅ Header background changes with theme
- ✅ Backdrop blur still works
- ✅ Border and shadow use theme variables
- ✅ Build successful
- ✅ No TypeScript errors

## Theme-Specific Header Backgrounds

Each theme now has its own header overlay:

- **Dark Terminal**: `rgba(0, 0, 0, 0.85)` - Deep black with transparency
- **Ocean Blue**: `rgba(10, 22, 40, 0.85)` - Navy blue with transparency
- **Forest Green**: `rgba(13, 27, 13, 0.85)` - Forest green with transparency
- **Sunset Orange**: `rgba(26, 15, 10, 0.85)` - Brown with transparency
- **Purple Haze**: `rgba(18, 10, 31, 0.85)` - Purple with transparency
- **Light Mode**: `rgba(0, 0, 0, 0.5)` - Semi-transparent black overlay

The backdrop-blur effect ensures readability across all themes while maintaining the glassmorphism aesthetic.
