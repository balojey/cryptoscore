# CryptoScore Theme System

## Overview

CryptoScore now features a comprehensive theme system that allows users to customize their experience with 6 different color schemes. The theme system uses CSS custom properties (variables) for dynamic theming and persists user preferences in localStorage.

## Available Themes

### 1. Dark Terminal (Default)
- **Icon**: Monitor
- **Style**: Professional trader-focused dark theme
- **Colors**: Deep blacks with cyan, green, and red accents
- **Best For**: Extended trading sessions, low-light environments

### 2. Ocean Blue
- **Icon**: Waves
- **Style**: Deep blue oceanic theme
- **Colors**: Navy blues with bright cyan and teal accents
- **Best For**: Users who prefer cooler color palettes

### 3. Forest Green
- **Icon**: Tree
- **Style**: Nature-inspired green theme
- **Colors**: Dark greens with mint and emerald accents
- **Best For**: Reduced eye strain, natural aesthetic

### 4. Sunset Orange
- **Icon**: Sunset
- **Style**: Warm sunset-inspired theme
- **Colors**: Dark browns with orange and amber accents
- **Best For**: Warm color preference, evening use

### 5. Purple Haze
- **Icon**: Shimmer
- **Style**: Vibrant purple and pink theme
- **Colors**: Deep purples with magenta and violet accents
- **Best For**: Creative users, unique aesthetic

### 6. Light Mode
- **Icon**: Sun
- **Style**: Clean light theme
- **Colors**: White backgrounds with blue and green accents
- **Best For**: Bright environments, daytime use

## Architecture

### ThemeContext (`src/contexts/ThemeContext.tsx`)

The theme system is built on React Context API:

```typescript
export type ThemePreset = 
  | 'dark-terminal' 
  | 'ocean-blue' 
  | 'forest-green' 
  | 'sunset-orange' 
  | 'purple-haze' 
  | 'light-mode'

interface ThemeContextType {
  theme: ThemePreset
  setTheme: (theme: ThemePreset) => void
}
```

**Features:**
- Centralized theme management
- localStorage persistence
- Dynamic CSS variable updates
- Type-safe theme selection

### ThemeSwitcher Component (`src/components/ThemeSwitcher.tsx`)

A dropdown menu component for theme selection:

**Features:**
- Visual theme preview with color swatches
- Active theme indicator
- Smooth transitions
- Accessible keyboard navigation
- Mobile-responsive design

### CSS Variables

All themes use the same set of CSS variables defined in `src/styles/tokens.css`:

**Background Colors:**
- `--bg-primary`: Main background
- `--bg-secondary`: Secondary surfaces
- `--bg-elevated`: Elevated cards/modals
- `--bg-hover`: Hover states
- `--bg-overlay`: Modal overlays

**Accent Colors:**
- `--accent-cyan`: Primary actions
- `--accent-green`: Success states
- `--accent-red`: Error/danger states
- `--accent-amber`: Warning states
- `--accent-purple`: Info/secondary actions

**Text Colors:**
- `--text-primary`: Main text
- `--text-secondary`: Secondary text
- `--text-tertiary`: Tertiary text
- `--text-disabled`: Disabled text
- `--text-inverse`: Inverse text (for buttons)

**Border Colors:**
- `--border-default`: Default borders
- `--border-hover`: Hover borders
- `--border-active`: Active/focused borders

## Usage

### Using the Theme Context

```typescript
import { useTheme } from './contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('ocean-blue')}>
        Switch to Ocean Blue
      </button>
    </div>
  )
}
```

### Styling with Theme Variables

```typescript
// Inline styles (recommended for dynamic theming)
<div style={{ 
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-default)'
}}>
  Content
</div>

// CSS classes
.my-component {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

### Adding the ThemeSwitcher

The ThemeSwitcher is already integrated in the Header component:

```typescript
import ThemeSwitcher from '../ThemeSwitcher'

<ThemeSwitcher />
```

## Creating a New Theme

To add a new theme preset:

1. **Add to ThemePreset type:**
```typescript
export type ThemePreset = 
  | 'dark-terminal' 
  | 'ocean-blue'
  | 'your-new-theme' // Add here
```

2. **Define theme colors in themePresets:**
```typescript
'your-new-theme': {
  name: 'Your Theme Name',
  icon: 'mdi--your-icon', // Iconify icon
  colors: {
    '--bg-primary': '#000000',
    '--bg-secondary': '#111111',
    // ... all other variables
  }
}
```

3. **Test all components** to ensure proper contrast and readability

## Accessibility Considerations

### Color Contrast

All themes maintain WCAG AA compliance:
- Text contrast ratio: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Testing Checklist

When creating new themes:
- [ ] Test all text colors against backgrounds
- [ ] Verify button states (hover, active, disabled)
- [ ] Check border visibility
- [ ] Test with screen readers
- [ ] Verify focus indicators
- [ ] Test in different lighting conditions

### Reduced Motion

The theme system respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance

### Optimization Strategies

1. **CSS Variables**: Instant theme switching without re-rendering
2. **localStorage**: Persists user preference across sessions
3. **No Flash**: Theme applied before first paint
4. **Minimal Re-renders**: Only ThemeProvider re-renders on change

### Bundle Impact

- ThemeContext: ~2KB
- ThemeSwitcher: ~3KB
- Total: ~5KB (minified + gzipped)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 12.2+)
- Opera: Full support

CSS Variables are supported in all modern browsers.

## Migration Guide

### From Hardcoded Colors

**Before:**
```typescript
<div style={{ background: '#1A1D23', color: '#FFFFFF' }}>
  Content
</div>
```

**After:**
```typescript
<div style={{ 
  background: 'var(--bg-secondary)', 
  color: 'var(--text-primary)' 
}}>
  Content
</div>
```

### From Tailwind Classes

**Before:**
```typescript
<div className="bg-gray-900 text-white">
  Content
</div>
```

**After:**
```typescript
<div style={{ 
  background: 'var(--bg-secondary)', 
  color: 'var(--text-primary)' 
}}>
  Content
</div>
```

## Best Practices

### Do's ✅

- Use CSS variables for all colors
- Test themes in different lighting
- Maintain consistent contrast ratios
- Provide visual feedback for theme changes
- Persist user preferences

### Don'ts ❌

- Don't hardcode color values
- Don't use Tailwind color classes for themed elements
- Don't forget to test accessibility
- Don't create themes with poor contrast
- Don't override user's system preferences unnecessarily

## Troubleshooting

### Theme Not Applying

1. Check if ThemeProvider wraps your app
2. Verify localStorage permissions
3. Clear browser cache
4. Check console for errors

### Colors Not Updating

1. Ensure you're using CSS variables
2. Check if inline styles override variables
3. Verify theme context is accessible
4. Inspect computed styles in DevTools

### Performance Issues

1. Avoid excessive theme switching
2. Use CSS variables instead of re-rendering
3. Minimize inline style usage
4. Profile with React DevTools

## Future Enhancements

Potential improvements:
- [ ] Custom theme creator
- [ ] Theme import/export
- [ ] Gradient themes
- [ ] Animated theme transitions
- [ ] System theme sync
- [ ] Per-page theme overrides
- [ ] Theme scheduling (day/night)

## Resources

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [React Context API](https://react.dev/reference/react/useContext)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Iconify Icons](https://icon-sets.iconify.design/)
