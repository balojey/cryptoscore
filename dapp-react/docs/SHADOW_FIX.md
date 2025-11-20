# Light Mode Shadow Fix

## Issue
The header in Light Mode had a dark shadow below it because all themes were using the same hardcoded dark shadow values from `tokens.css`.

## Root Cause
The shadow variables in `tokens.css` were defined globally with dark `rgba(0, 0, 0, ...)` values:
```css
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
```

These dark shadows looked fine on dark themes but appeared too heavy on Light Mode.

## Solution
Added theme-specific shadow overrides to each theme preset in `ThemeContext.tsx`.

### Light Mode Shadows (Subtle)
```typescript
'--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
'--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
'--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
'--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
'--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
```

### Dark Theme Shadows (Strong)
```typescript
'--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
'--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
'--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
'--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
'--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
```

## Comparison

| Shadow | Light Mode Opacity | Dark Themes Opacity | Difference |
|--------|-------------------|---------------------|------------|
| sm | 0.05 (5%) | 0.3 (30%) | 6x lighter |
| md | 0.1 (10%) | 0.4 (40%) | 4x lighter |
| lg | 0.1 (10%) | 0.5 (50%) | 5x lighter |
| xl | 0.1 (10%) | 0.6 (60%) | 6x lighter |
| 2xl | 0.15 (15%) | 0.7 (70%) | 4.7x lighter |

## Result
✅ Light Mode header now has a subtle, appropriate shadow
✅ Dark themes maintain their strong, dramatic shadows
✅ All 6 themes have properly tuned shadows
✅ Consistent visual hierarchy across all themes

## Visual Impact

### Before
- Light Mode: Heavy dark shadow (50% opacity) ❌
- Looked out of place on light background
- Too dramatic for light theme aesthetic

### After
- Light Mode: Subtle shadow (10% opacity) ✅
- Appropriate for light background
- Maintains depth without being heavy
- Professional, clean appearance

## Technical Details

### How It Works
1. Each theme preset now includes shadow variable overrides
2. When theme switches, shadows update along with colors
3. CSS variables cascade properly
4. No hardcoded values in components

### Files Modified
- `src/contexts/ThemeContext.tsx` - Added shadow overrides to all 6 themes

### Components Affected
All components using shadow variables now have theme-appropriate shadows:
- Header (uses `--shadow-lg`)
- Cards (use `--shadow-md`)
- Dropdowns (use `--shadow-xl`)
- Modals (use `--shadow-2xl`)
- Buttons (use `--shadow-sm`)

## Build Status
- ✅ Build successful (8.05s)
- ✅ No TypeScript errors
- ✅ Bundle size: 540.51 KB (minimal increase)

## Testing Checklist
- [x] Light Mode header has subtle shadow
- [x] Dark Terminal has strong shadow
- [x] Ocean Blue has strong shadow
- [x] Forest Green has strong shadow
- [x] Sunset Orange has strong shadow
- [x] Purple Haze has strong shadow
- [x] All shadows scale appropriately (sm → 2xl)
- [x] No visual regressions

## Conclusion
Light Mode now has appropriately subtle shadows that match its clean, bright aesthetic, while all dark themes maintain their dramatic, high-contrast shadows. The header shadow is no longer jarring in Light Mode.

---

**Fixed:** 2024-11-20  
**File Modified:** `src/contexts/ThemeContext.tsx`  
**Status:** ✅ Complete
