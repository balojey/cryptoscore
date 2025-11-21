# Design Document: Shadcn UI Migration

## Overview

This document outlines the technical design for migrating CryptoScore from DaisyUI to Shadcn UI. The migration will replace all DaisyUI components with Shadcn UI equivalents while preserving the existing 6-theme system, CSS variable architecture, visual design, and all functionality.

### Goals

1. Replace DaisyUI with Shadcn UI for better component flexibility and maintainability
2. Maintain the existing 6-theme system with instant switching
3. Preserve all visual design, animations, and user experience
4. Keep the CSS variable-based theming architecture
5. Maintain or improve bundle size and performance
6. Ensure full accessibility compliance (WCAG AA)

### Non-Goals

- Redesigning the UI or changing visual appearance
- Adding new features or functionality
- Changing the theme system architecture
- Modifying the routing or state management

## Architecture

### Current Architecture

**Component Library:** DaisyUI (Tailwind CSS plugin)
- Pre-built components with utility classes
- Theme configuration via Tailwind config
- Limited customization options
- Opinionated styling patterns

**Theme System:**
- 6 theme presets defined in ThemeContext
- CSS variables for all colors and design tokens
- Dynamic theme switching via React Context
- localStorage persistence
- Keyboard shortcut support (Ctrl+Shift+T)

**Styling Approach:**
- Tailwind CSS 4.1 with utility classes
- Custom CSS variables in tokens.css
- Component classes in components.css
- Animation library in animations.css
- DaisyUI plugin for component styles

### Target Architecture

**Component Library:** Shadcn UI (Radix UI + Tailwind CSS)
- Composable, unstyled Radix UI primitives
- Customizable component implementations
- Copy-paste component pattern (components live in codebase)
- Full control over styling and behavior

**Theme System:** (Unchanged)
- Same 6 theme presets
- Same CSS variable architecture
- Same ThemeContext implementation
- Same switching mechanisms

**Styling Approach:**
- Tailwind CSS 4.1 with utility classes
- CSS variables for theming (unchanged)
- Shadcn UI components styled with CSS variables
- Component classes adapted for Shadcn UI structure
- Animation library (unchanged)

### Key Differences

| Aspect | DaisyUI | Shadcn UI |
|--------|---------|-----------|
| **Installation** | npm package + plugin | CLI tool copies components |
| **Components** | Pre-built, opinionated | Customizable, composable |
| **Theming** | Tailwind config | CSS variables (perfect fit!) |
| **Customization** | Limited | Full control |
| **Bundle Size** | All components included | Only used components |
| **Accessibility** | Built-in | Radix UI primitives (excellent) |
| **Updates** | Package updates | Manual component updates |

## Components and Interfaces

### Shadcn UI Setup

**Installation:**
```bash
npx shadcn@latest init
```

**Configuration (components.json):**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/style.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Path Aliases (tsconfig.json):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Vite Configuration (vite.config.ts):**
```typescript
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Component Migration Map

#### Core UI Components

| DaisyUI Component | Shadcn UI Component | Notes |
|-------------------|---------------------|-------|
| `btn` | `Button` | Variants: default, destructive, outline, secondary, ghost, link |
| `card` | `Card` | Includes CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `badge` | `Badge` | Variants: default, secondary, destructive, outline |
| `modal` | `Dialog` | Includes DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription |
| `dropdown` | `DropdownMenu` | Includes DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem |
| `input` | `Input` | Standard input with variants |
| `select` | `Select` | Includes SelectTrigger, SelectContent, SelectItem |
| `checkbox` | `Checkbox` | Radix UI primitive |
| `toast` | `Toast` / `Sonner` | Use Sonner for better UX |
| `tooltip` | `Tooltip` | Includes TooltipTrigger, TooltipContent |
| `tabs` | `Tabs` | Includes TabsList, TabsTrigger, TabsContent |
| `progress` | `Progress` | Progress bar component |

#### Components to Install

```bash
# Core components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add tooltip
npx shadcn@latest add tabs
npx shadcn@latest add progress
npx shadcn@latest add sonner
```

### Theme Integration

**Shadcn UI Default CSS Variables (to be replaced):**

Shadcn UI uses HSL-based CSS variables by default. We'll replace these with our existing color system.

**Current Shadcn UI Variables:**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... more */
}
```

**Our Mapping Strategy:**

We'll modify Shadcn UI components to use our existing CSS variables instead of their default ones.

**Variable Mapping:**
```css
/* Shadcn UI Variable → CryptoScore Variable */
--background → var(--bg-primary)
--foreground → var(--text-primary)
--card → var(--bg-elevated)
--card-foreground → var(--text-primary)
--primary → var(--accent-cyan)
--primary-foreground → var(--text-inverse)
--secondary → var(--bg-secondary)
--secondary-foreground → var(--text-primary)
--muted → var(--bg-hover)
--muted-foreground → var(--text-tertiary)
--accent → var(--accent-cyan)
--accent-foreground → var(--text-inverse)
--destructive → var(--accent-red)
--destructive-foreground → var(--text-inverse)
--border → var(--border-default)
--input → var(--border-default)
--ring → var(--accent-cyan)
```

**Implementation Approach:**

1. Keep our existing CSS variables in tokens.css
2. Add Shadcn UI variable mappings that reference our variables
3. Modify Shadcn UI component styles to use our variables directly
4. Ensure all 6 themes work with Shadcn UI components

### Component Customization

**Button Component Example:**

```typescript
// src/components/ui/button.tsx (Shadcn UI generated)
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent-cyan)] text-[var(--text-inverse)] hover:bg-[var(--accent-cyan-hover)] hover:shadow-[var(--shadow-cyan-glow)]",
        destructive: "bg-[var(--accent-red)] text-[var(--text-inverse)] hover:bg-[var(--accent-red-hover)] hover:shadow-[var(--shadow-red-glow)]",
        success: "bg-[var(--accent-green)] text-[var(--text-inverse)] hover:bg-[var(--accent-green-hover)] hover:shadow-[var(--shadow-green-glow)]",
        outline: "border-2 border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]",
        secondary: "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
        ghost: "hover:bg-[var(--bg-hover)] text-[var(--text-primary)]",
        link: "text-[var(--accent-cyan)] underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Card Component Example:**

```typescript
// src/components/ui/card.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-lg)] transition-all hover:border-[var(--border-hover)] hover:-translate-y-0.5",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4 mb-4 border-b border-[var(--border-default)]", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold text-[var(--text-primary)] font-[var(--font-display)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-[var(--text-secondary)]", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
```

### Utility Functions

**cn() Helper (lib/utils.ts):**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

This utility combines class names intelligently, handling Tailwind class conflicts.

## Data Models

No data model changes required. The migration is purely a UI component replacement.

## Error Handling

### Component Error Boundaries

Wrap Shadcn UI components with error boundaries to catch rendering errors:

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg">
          <p className="text-[var(--error)]">Something went wrong. Please refresh the page.</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Migration Error Handling

During migration, handle potential issues:

1. **Missing Components:** Ensure all Shadcn UI components are installed before use
2. **Style Conflicts:** Test each component with all 6 themes
3. **TypeScript Errors:** Verify prop types match between DaisyUI and Shadcn UI
4. **Runtime Errors:** Test all interactive components thoroughly

## Testing Strategy

### Manual Testing Checklist

**Per Component:**
- [ ] Renders correctly in all 6 themes
- [ ] Hover states work properly
- [ ] Focus states are visible
- [ ] Click/interaction behavior matches original
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

**Per Theme:**
- [ ] All colors apply correctly
- [ ] Shadows render appropriately
- [ ] Text contrast meets WCAG AA
- [ ] Borders are visible
- [ ] Hover effects are visible

**Per Page:**
- [ ] All components render without errors
- [ ] Layout matches original design
- [ ] Animations work correctly
- [ ] No console errors
- [ ] Performance is acceptable

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Accessibility Testing

- [ ] Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] Screen reader testing (NVDA/JAWS/VoiceOver)
- [ ] Color contrast validation (all themes)
- [ ] Focus indicators visible
- [ ] ARIA labels present and correct

### Performance Testing

- [ ] Bundle size comparison (before/after)
- [ ] Lighthouse score (should maintain or improve)
- [ ] Time to Interactive (should maintain or improve)
- [ ] First Contentful Paint (should maintain or improve)

## Migration Phases

### Phase 1: Setup and Configuration

1. Install Shadcn UI CLI and dependencies
2. Configure path aliases in tsconfig.json and vite.config.ts
3. Create components.json configuration
4. Install core Shadcn UI components
5. Create utility functions (cn helper)
6. Set up CSS variable mappings

### Phase 2: Core Components

1. Replace Button components
2. Replace Card components
3. Replace Badge components
4. Test with all 6 themes
5. Verify accessibility

### Phase 3: Form Components

1. Replace Input components
2. Replace Select components
3. Replace Checkbox components
4. Update form validation
5. Test form interactions

### Phase 4: Overlay Components

1. Replace Dialog/Modal components
2. Replace DropdownMenu components
3. Replace Tooltip components
4. Test overlay positioning and behavior

### Phase 5: Feedback Components

1. Replace Toast notifications (migrate to Sonner)
2. Replace Progress bars
3. Test notification system
4. Verify animations

### Phase 6: Cleanup and Optimization

1. Remove DaisyUI package and plugin
2. Remove unused DaisyUI classes
3. Update component classes in components.css
4. Optimize bundle size
5. Update documentation

### Phase 7: Testing and Validation

1. Comprehensive testing across all pages
2. Theme testing (all 6 presets)
3. Browser compatibility testing
4. Accessibility audit
5. Performance benchmarking

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "sonner": "^1.3.1"
  }
}
```

### Dependencies to Remove

```json
{
  "dependencies": {
    "daisyui": "^5.1.25"  // Remove after migration complete
  }
}
```

### Bundle Size Impact

**Estimated Changes:**
- DaisyUI removal: -50KB (gzipped)
- Radix UI primitives: +30KB (gzipped, only used components)
- Net change: -20KB (improvement)

## Documentation Updates

### Files to Update

1. **best-practices.md** - Add Shadcn UI patterns and guidelines
2. **theme-system.md** - Document Shadcn UI theme integration
3. **structure.md** - Update component organization
4. **features.md** - Update component references
5. **README.md** - Update setup instructions

### New Documentation

1. **SHADCN_MIGRATION.md** - Complete migration guide
2. **COMPONENT_GUIDE.md** - Shadcn UI component usage examples

## Rollback Plan

If critical issues arise during migration:

1. **Git Branch Strategy:** Perform migration in feature branch
2. **Incremental Commits:** Commit after each component type migration
3. **Testing Gates:** Don't proceed to next phase until current phase passes tests
4. **Rollback Points:** Can revert to any previous commit
5. **Backup:** Keep DaisyUI package until migration fully validated

## Success Criteria

Migration is successful when:

1. ✅ All DaisyUI components replaced with Shadcn UI
2. ✅ All 6 themes work correctly
3. ✅ Visual appearance matches original design
4. ✅ All functionality preserved
5. ✅ No TypeScript errors
6. ✅ No console errors
7. ✅ WCAG AA compliance maintained
8. ✅ Bundle size maintained or reduced
9. ✅ Performance maintained or improved
10. ✅ Documentation updated

## Timeline Estimate

- **Phase 1 (Setup):** 2-3 hours
- **Phase 2 (Core Components):** 4-6 hours
- **Phase 3 (Form Components):** 3-4 hours
- **Phase 4 (Overlay Components):** 3-4 hours
- **Phase 5 (Feedback Components):** 2-3 hours
- **Phase 6 (Cleanup):** 2-3 hours
- **Phase 7 (Testing):** 4-6 hours

**Total Estimated Time:** 20-29 hours

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Theme variables don't map correctly | High | Medium | Test each component with all themes immediately |
| Component behavior differs | High | Low | Thorough testing of interactions |
| Accessibility regression | High | Low | Accessibility audit after each phase |
| Bundle size increases | Medium | Low | Monitor bundle size, use tree-shaking |
| TypeScript errors | Medium | Medium | Fix types incrementally, use strict mode |
| Performance degradation | Medium | Low | Performance testing after migration |
| Breaking existing features | High | Low | Comprehensive functional testing |

## Conclusion

This migration from DaisyUI to Shadcn UI will provide CryptoScore with a more flexible, maintainable component system while preserving all existing functionality, themes, and user experience. The phased approach ensures safe, incremental progress with testing gates at each stage.
