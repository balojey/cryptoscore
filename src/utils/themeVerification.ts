/**
 * Theme Verification Utility
 * Validates that all CSS variables are properly applied across all 6 theme presets
 */

import type { ThemePreset } from '../contexts/ThemeContext'
import { themePresets } from '../contexts/ThemeContext'

export interface ThemeVerificationResult {
  theme: ThemePreset
  passed: boolean
  errors: string[]
  warnings: string[]
  cssVariables: {
    defined: string[]
    missing: string[]
  }
  shadowIntensities: {
    appropriate: boolean
    details: string
  }
  contrastRatios: {
    passed: boolean
    details: string[]
  }
}

// Required CSS variables that must be defined in all themes
const REQUIRED_CSS_VARIABLES = [
  '--bg-primary',
  '--bg-secondary',
  '--bg-elevated',
  '--bg-hover',
  '--bg-overlay',
  '--accent-cyan',
  '--accent-cyan-hover',
  '--accent-cyan-glow',
  '--accent-green',
  '--accent-green-hover',
  '--accent-green-glow',
  '--accent-red',
  '--accent-red-hover',
  '--accent-red-glow',
  '--accent-amber',
  '--accent-amber-hover',
  '--accent-amber-glow',
  '--accent-purple',
  '--accent-purple-hover',
  '--accent-purple-glow',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--text-disabled',
  '--text-inverse',
  '--border-default',
  '--border-hover',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--shadow-xl',
  '--shadow-2xl',
]

/**
 * Calculate relative luminance for contrast ratio calculation
 * Based on WCAG 2.0 formula
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  // Parse hex colors
  const parseHex = (hex: string) => {
    const clean = hex.replace('#', '')
    return {
      r: Number.parseInt(clean.substring(0, 2), 16),
      g: Number.parseInt(clean.substring(2, 4), 16),
      b: Number.parseInt(clean.substring(4, 6), 16),
    }
  }

  // Parse rgba colors
  const parseRgba = (rgba: string) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!match)
      return { r: 0, g: 0, b: 0 }
    return {
      r: Number.parseInt(match[1]),
      g: Number.parseInt(match[2]),
      b: Number.parseInt(match[3]),
    }
  }

  let c1, c2
  if (color1.startsWith('#')) {
    c1 = parseHex(color1)
  }
  else if (color1.startsWith('rgb')) {
    c1 = parseRgba(color1)
  }
  else {
    return 0
  }

  if (color2.startsWith('#')) {
    c2 = parseHex(color2)
  }
  else if (color2.startsWith('rgb')) {
    c2 = parseRgba(color2)
  }
  else {
    return 0
  }

  const l1 = getLuminance(c1.r, c1.g, c1.b)
  const l2 = getLuminance(c2.r, c2.g, c2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Verify shadow intensities are appropriate for theme
 */
function verifyShadowIntensities(theme: ThemePreset, colors: Record<string, string>): {
  appropriate: boolean
  details: string
} {
  const isLightMode = theme === 'light-mode'
  const shadows = [
    colors['--shadow-sm'],
    colors['--shadow-md'],
    colors['--shadow-lg'],
    colors['--shadow-xl'],
    colors['--shadow-2xl'],
  ]

  // Extract opacity from shadow definitions
  const opacities = shadows.map((shadow) => {
    const match = shadow.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
    return match ? Number.parseFloat(match[1]) : 0
  })

  if (isLightMode) {
    // Light mode should have subtle shadows (5-15% opacity)
    const allSubtle = opacities.every(opacity => opacity >= 0.05 && opacity <= 0.15)
    return {
      appropriate: allSubtle,
      details: allSubtle
        ? 'Light mode shadows are appropriately subtle (5-15% opacity)'
        : `Light mode shadows should be subtle (5-15%), found: ${opacities.map(o => `${(o * 100).toFixed(0)}%`).join(', ')}`,
    }
  }
  else {
    // Dark themes should have stronger shadows (30-70% opacity)
    const allStrong = opacities.every(opacity => opacity >= 0.3 && opacity <= 0.7)
    return {
      appropriate: allStrong,
      details: allStrong
        ? 'Dark theme shadows are appropriately strong (30-70% opacity)'
        : `Dark theme shadows should be strong (30-70%), found: ${opacities.map(o => `${(o * 100).toFixed(0)}%`).join(', ')}`,
    }
  }
}

/**
 * Verify contrast ratios meet WCAG AA standards
 */
function verifyContrastRatios(colors: Record<string, string>): {
  passed: boolean
  details: string[]
} {
  const details: string[] = []
  let allPassed = true

  // Test text on backgrounds (WCAG AA requires 4.5:1 for normal text)
  const textBackgroundPairs = [
    { text: '--text-primary', bg: '--bg-primary', label: 'Primary text on primary background' },
    { text: '--text-secondary', bg: '--bg-primary', label: 'Secondary text on primary background' },
    { text: '--text-primary', bg: '--bg-elevated', label: 'Primary text on elevated background' },
    { text: '--text-inverse', bg: '--accent-cyan', label: 'Inverse text on cyan accent' },
  ]

  textBackgroundPairs.forEach(({ text, bg, label }) => {
    const textColor = colors[text]
    const bgColor = colors[bg]

    if (textColor && bgColor) {
      const ratio = getContrastRatio(textColor, bgColor)
      const passed = ratio >= 4.5

      if (!passed) {
        allPassed = false
        details.push(`❌ ${label}: ${ratio.toFixed(2)}:1 (needs 4.5:1)`)
      }
      else {
        details.push(`✅ ${label}: ${ratio.toFixed(2)}:1`)
      }
    }
  })

  return { passed: allPassed, details }
}

/**
 * Verify a single theme preset
 */
export function verifyTheme(theme: ThemePreset): ThemeVerificationResult {
  const preset = themePresets[theme]
  const errors: string[] = []
  const warnings: string[] = []
  const definedVars: string[] = []
  const missingVars: string[] = []

  // Check all required CSS variables are defined
  REQUIRED_CSS_VARIABLES.forEach((varName) => {
    if (preset.colors[varName]) {
      definedVars.push(varName)
    }
    else {
      missingVars.push(varName)
      errors.push(`Missing required CSS variable: ${varName}`)
    }
  })

  // Verify shadow intensities
  const shadowCheck = verifyShadowIntensities(theme, preset.colors)
  if (!shadowCheck.appropriate) {
    warnings.push(shadowCheck.details)
  }

  // Verify contrast ratios
  const contrastCheck = verifyContrastRatios(preset.colors)
  if (!contrastCheck.passed) {
    errors.push('Some contrast ratios do not meet WCAG AA standards')
  }

  const passed = errors.length === 0

  return {
    theme,
    passed,
    errors,
    warnings,
    cssVariables: {
      defined: definedVars,
      missing: missingVars,
    },
    shadowIntensities: shadowCheck,
    contrastRatios: contrastCheck,
  }
}

/**
 * Verify all theme presets
 */
export function verifyAllThemes(): ThemeVerificationResult[] {
  const themes: ThemePreset[] = [
    'dark-terminal',
    'ocean-blue',
    'forest-green',
    'sunset-orange',
    'purple-haze',
    'light-mode',
  ]

  return themes.map(theme => verifyTheme(theme))
}

/**
 * Generate a verification report
 */
export function generateVerificationReport(results: ThemeVerificationResult[]): string {
  let report = '# Theme Verification Report\n\n'
  report += `Generated: ${new Date().toLocaleString()}\n\n`

  results.forEach((result) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED'
    report += `## ${themePresets[result.theme].name} (${result.theme}) - ${status}\n\n`

    if (result.errors.length > 0) {
      report += '### Errors\n'
      result.errors.forEach(error => report += `- ${error}\n`)
      report += '\n'
    }

    if (result.warnings.length > 0) {
      report += '### Warnings\n'
      result.warnings.forEach(warning => report += `- ${warning}\n`)
      report += '\n'
    }

    report += '### CSS Variables\n'
    report += `- Defined: ${result.cssVariables.defined.length}/${REQUIRED_CSS_VARIABLES.length}\n`
    if (result.cssVariables.missing.length > 0) {
      report += `- Missing: ${result.cssVariables.missing.join(', ')}\n`
    }
    report += '\n'

    report += '### Shadow Intensities\n'
    report += `- ${result.shadowIntensities.details}\n\n`

    report += '### Contrast Ratios (WCAG AA)\n'
    result.contrastRatios.details.forEach(detail => report += `- ${detail}\n`)
    report += '\n'

    report += '---\n\n'
  })

  const totalPassed = results.filter(r => r.passed).length
  const totalFailed = results.filter(r => !r.passed).length

  report += `## Summary\n\n`
  report += `- Total Themes: ${results.length}\n`
  report += `- Passed: ${totalPassed}\n`
  report += `- Failed: ${totalFailed}\n`

  return report
}
