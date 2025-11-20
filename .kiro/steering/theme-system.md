# Theme System Guide

## Overview

CryptoScore features a comprehensive theme system with 6 professionally designed themes. All components use CSS variables for dynamic theming, ensuring instant switching and consistent styling.

## Available Themes

### 1. Dark Terminal (Default)
- **Icon**: Monitor
- **Style**: Professional trader-focused dark theme
- **Colors**: Deep blacks with cyan, green, and red neon accents
- **Shadows**: Strong (30-70% opacity)
- **Best For**: Extended trading sessions, low-light environments

### 2. Ocean Blue
- **Icon**: Waves
- **Style**: Deep blue oceanic theme
- **Colors**: Navy blues with bright cyan and teal accents
- **Shadows**: Strong (30-70% opacity)
- **Best For**: Cool color preference, calming aesthetic

### 3. Forest Green
- **Icon**: Tree
- **Style**: Nature-inspired green theme
- **Colors**: Dark greens with mint and emerald accents
- **Shadows**: Strong (30-70% opacity)
- **Best For**: Reduced eye strain, unique aesthetic

### 4. Sunset Orange
- **Icon**: Sunset
- **Style**: Warm sunset-inspired theme
- **Colors**: Dark browns with orange and amber accents
- **Shadows**: Strong (30-70% opacity)
- **Best For**: Warm color preference, evening use

### 5. Purple Haze
- **Icon**: Shimmer
- **Style**: Vibrant purple and pink theme
- **Colors**: Deep purples with magenta and violet accents
- **Shadows**: Strong (30-70% opacity)
- **Best For**: Creative users, vibrant experience

### 6. Light Mode
- **Icon**: Sun
- **Style**: Clean light theme
- **Colors**: White backgrounds with blue and green accents
- **Shadows**: Subtle (5-15% opacity)
- **Best For**: Bright environments, daytime use

## Implementation

### Architecture
- **Context**: `src/contexts/ThemeContext.tsx` - Theme management with React Context
- **Component**: `src/components/ThemeSwitcher.tsx` - UI for theme selection
- **Tokens**: `src/styles/tokens.css` - Base design tokens
- **Components**: `src/styles/components.css` - Component styles

### CSS Variables

All themes use these variables:

**Backgrounds:**
- `--bg-primary` - Main background
- `--bg-secondary` - Secondary surfaces
- `--bg-elevated` - Cards, modals
- `--bg-hover` - Hover states
- `--bg-overlay` - Header overlay

**Accents:**
- `--accent-cyan` - Primary actions
- `--accent-green` - Success states
- `--accent-red` - Error/danger states
- `--accent-amber` - Warning states
- `--accent-purple` - Info/secondary

**Text:**
- `--text-primary` - Main text
- `--text-secondary` - Secondary text
- `--text-tertiary` - Tertiary text
- `--text-disabled` - Disabled text
- `--text-inverse` - Button text

**Borders:**
- `--border-default` - Default borders
- `--border-hover` - Hover borders

**Shadows:**
- `--shadow-sm` through `--shadow-2xl` - Theme-specific shadows

## Usage

### For Users

**Via UI:**
1. Click theme button in header
2. Select desired theme from dropdown
3. Preview colors before selecting

**Via Keyboard:**
- Press `Ctrl+Shift+T` (Windows/Linux)
- Press `Cmd+Shift+T` (Mac)
- Cycles through all 6 themes instantly

### For Developers

**Using Theme Context:**
```typescript
import { useTheme } from './contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div style={{ 
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)'
    }}>
      Current theme: {theme}
    </div>
  )
}
```

**Styling Components:**
```typescript
// ✅ Good - Uses CSS variables
<div style={{ 
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-default)'
}}>
  Content
</div>

// ❌ Bad - Hardcoded colors
<div className="bg-slate-800 text-white border-slate-700">
  Content
</div>
```

## Best Practices

### Do's ✅
- Use CSS variables for all colors
- Test components with all 6 themes
- Maintain WCAG AA contrast ratios
- Use semantic color variables
- Respect theme-specific shadows

### Don'ts ❌
- Don't hardcode color values
- Don't use Tailwind color classes for themed elements
- Don't forget to test accessibility
- Don't create themes with poor contrast
- Don't override user preferences unnecessarily

## Development Guidelines

### Adding New Components
1. Use CSS variables for all colors
2. Test with all 6 themes
3. Verify accessibility (contrast ratios)
4. Check hover and focus states
5. Ensure shadows are appropriate

### Creating New Themes
1. Add to `ThemePreset` type in `ThemeContext.tsx`
2. Define all required CSS variables
3. Test contrast ratios (WCAG AA)
4. Verify with all components
5. Document in theme guides

### Testing Checklist
- [ ] Component renders in all 6 themes
- [ ] Text is readable (4.5:1 contrast)
- [ ] Hover states are visible
- [ ] Focus indicators are clear
- [ ] Shadows are appropriate
- [ ] No hardcoded colors
- [ ] Mobile responsive

## Accessibility

### WCAG AA Compliance
All themes maintain:
- Text contrast: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Features
- Full keyboard navigation
- Screen reader compatible
- Proper ARIA labels
- Semantic HTML
- Reduced motion support

## Performance

### Metrics
- Bundle size: ~5KB (minified + gzipped)
- Theme switching: <50ms (instant)
- No re-renders (except ThemeProvider)
- Zero layout shift
- Minimal memory footprint

### Optimization
- CSS variables for zero-cost switching
- localStorage for persistence
- Efficient event handling
- No unnecessary re-renders

## Documentation

### User Documentation
- `THEMES_QUICKSTART.md` - Quick start guide
- `docs/THEME_PREVIEW.md` - Visual theme guide

### Developer Documentation
- `docs/THEME_SYSTEM.md` - Complete guide
- `docs/THEME_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `docs/THEME_AUDIT_COMPLETE.md` - Component audit
- `CHANGELOG.md` - Version history

## Troubleshooting

### Theme Not Applying
1. Check if ThemeProvider wraps app
2. Verify localStorage permissions
3. Clear browser cache
4. Check console for errors

### Colors Not Updating
1. Ensure using CSS variables
2. Check inline style overrides
3. Verify theme context accessible
4. Inspect computed styles

### Performance Issues
1. Avoid excessive theme switching
2. Use CSS variables (not re-rendering)
3. Minimize inline styles
4. Profile with React DevTools

## Future Enhancements

Potential improvements:
- [ ] Custom theme creator
- [ ] Theme import/export
- [ ] Animated transitions
- [ ] System theme sync
- [ ] Theme scheduling
- [ ] Per-page overrides
- [ ] Gradient themes
- [ ] Community themes

## Support

For issues or questions:
1. Check documentation in `docs/`
2. Review best practices guide
3. Open GitHub issue
4. Check existing themes for examples

---

**Version**: 2.0.0  
**Last Updated**: 2024-11-20  
**Status**: Production Ready ✅
