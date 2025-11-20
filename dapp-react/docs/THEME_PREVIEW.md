# CryptoScore Theme Preview

Visual guide to all available themes in CryptoScore.

## How to Switch Themes

1. **Via Header Menu**: Click the theme button in the header (next to wallet connect)
2. **Keyboard Shortcut**: Press `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac) to cycle through themes

---

## Theme 1: Dark Terminal (Default)

**Best For:** Professional trading, low-light environments, extended sessions

**Color Palette:**
- Background: `#0B0E11` (Deep Black)
- Secondary: `#1A1D23` (Dark Gray)
- Primary Accent: `#00D4FF` (Cyan)
- Success: `#00FF88` (Neon Green)
- Error: `#FF3366` (Red)
- Warning: `#FFB800` (Amber)

**Characteristics:**
- High contrast for readability
- Professional trader aesthetic
- Reduced eye strain in dark environments
- Neon accents for important actions

---

## Theme 2: Ocean Blue

**Best For:** Users who prefer cooler color palettes, calming aesthetic

**Color Palette:**
- Background: `#0A1628` (Deep Navy)
- Secondary: `#132F4C` (Ocean Blue)
- Primary Accent: `#00E5FF` (Bright Cyan)
- Success: `#00E676` (Mint Green)
- Error: `#FF5252` (Coral Red)
- Warning: `#FFD740` (Golden Yellow)

**Characteristics:**
- Oceanic color scheme
- Calming blue tones
- High contrast with bright accents
- Professional yet relaxed feel

---

## Theme 3: Forest Green

**Best For:** Nature lovers, reduced eye strain, unique aesthetic

**Color Palette:**
- Background: `#0D1B0D` (Deep Forest)
- Secondary: `#1A2F1A` (Dark Green)
- Primary Accent: `#00E5CC` (Teal)
- Success: `#69F0AE` (Mint)
- Error: `#FF6B6B` (Soft Red)
- Warning: `#FFD54F` (Soft Yellow)

**Characteristics:**
- Nature-inspired palette
- Soothing green tones
- Excellent for long sessions
- Unique, memorable aesthetic

---

## Theme 4: Sunset Orange

**Best For:** Warm color preference, evening use, creative work

**Color Palette:**
- Background: `#1A0F0A` (Deep Brown)
- Secondary: `#2D1B13` (Dark Chocolate)
- Primary Accent: `#FF9E40` (Orange)
- Success: `#FFD54F` (Golden)
- Error: `#FF5252` (Red)
- Warning: `#FFAB40` (Amber)

**Characteristics:**
- Warm, inviting colors
- Sunset-inspired palette
- Cozy evening aesthetic
- High energy with warm tones

---

## Theme 5: Purple Haze

**Best For:** Creative users, unique aesthetic, vibrant experience

**Color Palette:**
- Background: `#120A1F` (Deep Purple)
- Secondary: `#1F1333` (Dark Violet)
- Primary Accent: `#B388FF` (Light Purple)
- Success: `#69F0AE` (Mint Green)
- Error: `#FF4081` (Pink)
- Warning: `#FFD740` (Yellow)

**Characteristics:**
- Vibrant purple and pink
- Creative, artistic feel
- High contrast with neon accents
- Memorable, unique aesthetic

---

## Theme 6: Light Mode

**Best For:** Bright environments, daytime use, traditional preference

**Color Palette:**
- Background: `#F8FAFC` (Light Gray)
- Secondary: `#F1F5F9` (Soft Gray)
- Primary Accent: `#0EA5E9` (Sky Blue)
- Success: `#10B981` (Green)
- Error: `#EF4444` (Red)
- Warning: `#F59E0B` (Orange)

**Characteristics:**
- Clean, professional light theme
- Excellent for bright environments
- Traditional light mode aesthetic
- High readability in daylight

---

## Accessibility

All themes maintain **WCAG AA compliance**:
- Text contrast: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Testing

Each theme has been tested for:
- ✅ Color contrast ratios
- ✅ Readability in different lighting
- ✅ Button state visibility
- ✅ Border and focus indicators
- ✅ Screen reader compatibility
- ✅ Keyboard navigation

---

## Theme Comparison

| Feature | Dark Terminal | Ocean Blue | Forest Green | Sunset Orange | Purple Haze | Light Mode |
|---------|--------------|------------|--------------|---------------|-------------|------------|
| **Eye Strain** | Low | Low | Very Low | Low | Medium | Medium |
| **Contrast** | High | High | High | High | Very High | High |
| **Energy** | Professional | Calm | Relaxed | Warm | Vibrant | Clean |
| **Uniqueness** | Standard | Moderate | High | High | Very High | Standard |
| **Best Time** | Night | Anytime | Anytime | Evening | Anytime | Day |

---

## Customization Tips

### Choosing Your Theme

Consider these factors:
1. **Environment**: Bright office vs. dark room
2. **Time of Day**: Daytime vs. nighttime trading
3. **Personal Preference**: Cool vs. warm colors
4. **Session Length**: Extended sessions benefit from lower contrast
5. **Mood**: Professional vs. creative vs. relaxed

### Quick Switching

Use the keyboard shortcut `Ctrl+Shift+T` to quickly cycle through themes and find your favorite!

### Persistence

Your theme choice is automatically saved and will be restored when you return to CryptoScore.

---

## Technical Details

### Color Variables

All themes use the same CSS variable structure:

```css
/* Backgrounds */
--bg-primary        /* Main background */
--bg-secondary      /* Secondary surfaces */
--bg-elevated       /* Cards, modals */
--bg-hover          /* Hover states */
--bg-overlay        /* Modal overlays */

/* Accents */
--accent-cyan       /* Primary actions */
--accent-green      /* Success states */
--accent-red        /* Errors, danger */
--accent-amber      /* Warnings */
--accent-purple     /* Info, secondary */

/* Text */
--text-primary      /* Main text */
--text-secondary    /* Secondary text */
--text-tertiary     /* Tertiary text */
--text-disabled     /* Disabled text */
--text-inverse      /* Button text */

/* Borders */
--border-default    /* Default borders */
--border-hover      /* Hover borders */
```

### Performance

- **Switching Speed**: Instant (no page reload)
- **Bundle Size**: ~5KB total
- **Memory Impact**: Negligible
- **Browser Support**: All modern browsers

---

## Feedback

We'd love to hear your thoughts on the themes!

**Which theme is your favorite?**
- Dark Terminal
- Ocean Blue
- Forest Green
- Sunset Orange
- Purple Haze
- Light Mode

**Want a new theme?** Open an issue with your color palette suggestions!

---

## Future Themes

Potential themes under consideration:
- **Midnight Blue**: Even darker blue theme
- **Cherry Blossom**: Pink and white theme
- **Matrix**: Green terminal theme
- **Cyberpunk**: Neon pink and blue
- **Monochrome**: Pure black and white
- **Nord**: Popular Nord color scheme

Vote for your favorites or suggest new themes in our GitHub discussions!
