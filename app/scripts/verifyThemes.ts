/**
 * Theme Verification Script
 * Run this script to verify all themes meet requirements
 * Usage: npx tsx scripts/verifyThemes.ts
 */

import type { ThemePreset } from '../src/contexts/ThemeContext'
import { themePresets } from '../src/contexts/ThemeContext'

// Required CSS variables
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

interface VerificationResult {
  theme: ThemePreset
  passed: boolean
  errors: string[]
  warnings: string[]
}

function verifyTheme(theme: ThemePreset): VerificationResult {
  const preset = themePresets[theme]
  const errors: string[] = []
  const warnings: string[] = []

  // Check all required CSS variables are defined
  REQUIRED_CSS_VARIABLES.forEach((varName) => {
    if (!preset.colors[varName]) {
      errors.push(`Missing required CSS variable: ${varName}`)
    }
  })

  // Verify shadow intensities
  const isLightMode = theme === 'light-mode'
  const shadows = [
    preset.colors['--shadow-sm'],
    preset.colors['--shadow-md'],
    preset.colors['--shadow-lg'],
    preset.colors['--shadow-xl'],
    preset.colors['--shadow-2xl'],
  ]

  const opacities = shadows.map((shadow) => {
    const match = shadow?.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
    return match ? Number.parseFloat(match[1]) : 0
  })

  if (isLightMode) {
    const allSubtle = opacities.every(opacity => opacity >= 0.05 && opacity <= 0.15)
    if (!allSubtle) {
      warnings.push(`Light mode shadows should be subtle (5-15%), found: ${opacities.map(o => `${(o * 100).toFixed(0)}%`).join(', ')}`)
    }
  }
  else {
    const allStrong = opacities.every(opacity => opacity >= 0.3 && opacity <= 0.7)
    if (!allStrong) {
      warnings.push(`Dark theme shadows should be strong (30-70%), found: ${opacities.map(o => `${(o * 100).toFixed(0)}%`).join(', ')}`)
    }
  }

  const passed = errors.length === 0

  return {
    theme,
    passed,
    errors,
    warnings,
  }
}

function main() {
  console.log('🎨 Theme Verification Script\n')
  console.log('='.repeat(60))
  console.log()

  const themes: ThemePreset[] = [
    'dark-terminal',
    'ocean-blue',
    'forest-green',
    'sunset-orange',
    'purple-haze',
    'light-mode',
  ]

  const results: VerificationResult[] = []
  let totalPassed = 0
  let totalFailed = 0

  themes.forEach((theme) => {
    const result = verifyTheme(theme)
    results.push(result)

    const status = result.passed ? '✅ PASSED' : '❌ FAILED'
    console.log(`${status} - ${themePresets[theme].name} (${theme})`)

    if (result.errors.length > 0) {
      console.log('  Errors:')
      result.errors.forEach(error => console.log(`    - ${error}`))
      totalFailed++
    }
    else {
      totalPassed++
    }

    if (result.warnings.length > 0) {
      console.log('  Warnings:')
      result.warnings.forEach(warning => console.log(`    - ${warning}`))
    }

    console.log()
  })

  console.log('='.repeat(60))
  console.log()
  console.log('📊 Summary:')
  console.log(`  Total Themes: ${themes.length}`)
  console.log(`  Passed: ${totalPassed}`)
  console.log(`  Failed: ${totalFailed}`)
  console.log()

  if (totalFailed > 0) {
    console.log('❌ Some themes failed verification')
    process.exit(1)
  }
  else {
    console.log('✅ All themes passed verification!')
    process.exit(0)
  }
}

main()
