import { createContext, use, useEffect, useState } from 'react'

export type ThemePreset = 'dark-terminal' | 'ocean-blue' | 'forest-green' | 'sunset-orange' | 'purple-haze' | 'light-mode'

interface ThemeContextType {
  theme: ThemePreset
  setTheme: (theme: ThemePreset) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const themePresets: Record<ThemePreset, {
  name: string
  icon: string
  colors: Record<string, string>
}> = {
  'dark-terminal': {
    name: 'Dark Terminal',
    icon: 'mdi--monitor',
    colors: {
      '--bg-primary': '#0B0E11',
      '--bg-secondary': '#1A1D23',
      '--bg-elevated': '#252930',
      '--bg-hover': '#2D3748',
      '--bg-overlay': 'rgba(0, 0, 0, 0.85)',
      '--accent-cyan': '#00D4FF',
      '--accent-cyan-hover': '#00B8E6',
      '--accent-cyan-glow': 'rgba(0, 212, 255, 0.3)',
      '--accent-green': '#00FF88',
      '--accent-green-hover': '#00E67A',
      '--accent-green-glow': 'rgba(0, 255, 136, 0.3)',
      '--accent-red': '#FF3366',
      '--accent-red-hover': '#E62E5C',
      '--accent-red-glow': 'rgba(255, 51, 102, 0.3)',
      '--accent-amber': '#FFB800',
      '--accent-amber-hover': '#E6A600',
      '--accent-amber-glow': 'rgba(255, 184, 0, 0.3)',
      '--accent-purple': '#8B5CF6',
      '--accent-purple-hover': '#7C3AED',
      '--accent-purple-glow': 'rgba(139, 92, 246, 0.3)',
      '--text-primary': '#FFFFFF',
      '--text-secondary': '#A0AEC0',
      '--text-tertiary': '#718096',
      '--text-disabled': '#4A5568',
      '--text-inverse': '#0B0E11',
      '--border-default': '#2D3748',
      '--border-hover': '#4A5568',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
      '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    },
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    icon: 'mdi--waves',
    colors: {
      '--bg-primary': '#0A1628',
      '--bg-secondary': '#132F4C',
      '--bg-elevated': '#1E4976',
      '--bg-hover': '#2A5A8F',
      '--bg-overlay': 'rgba(10, 22, 40, 0.85)',
      '--accent-cyan': '#00E5FF',
      '--accent-cyan-hover': '#00C4E0',
      '--accent-cyan-glow': 'rgba(0, 229, 255, 0.4)',
      '--accent-green': '#00E676',
      '--accent-green-hover': '#00C853',
      '--accent-green-glow': 'rgba(0, 230, 118, 0.4)',
      '--accent-red': '#FF5252',
      '--accent-red-hover': '#FF1744',
      '--accent-red-glow': 'rgba(255, 82, 82, 0.4)',
      '--accent-amber': '#FFD740',
      '--accent-amber-hover': '#FFC400',
      '--accent-amber-glow': 'rgba(255, 215, 64, 0.4)',
      '--accent-purple': '#7C4DFF',
      '--accent-purple-hover': '#651FFF',
      '--accent-purple-glow': 'rgba(124, 77, 255, 0.4)',
      '--text-primary': '#E3F2FD',
      '--text-secondary': '#90CAF9',
      '--text-tertiary': '#64B5F6',
      '--text-disabled': '#42A5F5',
      '--text-inverse': '#0A1628',
      '--border-default': '#2A5A8F',
      '--border-hover': '#3D7AB8',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
      '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    },
  },
  'forest-green': {
    name: 'Forest Green',
    icon: 'mdi--tree',
    colors: {
      '--bg-primary': '#0D1B0D',
      '--bg-secondary': '#1A2F1A',
      '--bg-elevated': '#274527',
      '--bg-hover': '#355C35',
      '--bg-overlay': 'rgba(13, 27, 13, 0.85)',
      '--accent-cyan': '#00E5CC',
      '--accent-cyan-hover': '#00C4B0',
      '--accent-cyan-glow': 'rgba(0, 229, 204, 0.4)',
      '--accent-green': '#69F0AE',
      '--accent-green-hover': '#00E676',
      '--accent-green-glow': 'rgba(105, 240, 174, 0.4)',
      '--accent-red': '#FF6B6B',
      '--accent-red-hover': '#FF5252',
      '--accent-red-glow': 'rgba(255, 107, 107, 0.4)',
      '--accent-amber': '#FFD54F',
      '--accent-amber-hover': '#FFCA28',
      '--accent-amber-glow': 'rgba(255, 213, 79, 0.4)',
      '--accent-purple': '#BA68C8',
      '--accent-purple-hover': '#AB47BC',
      '--accent-purple-glow': 'rgba(186, 104, 200, 0.4)',
      '--text-primary': '#E8F5E9',
      '--text-secondary': '#A5D6A7',
      '--text-tertiary': '#81C784',
      '--text-disabled': '#66BB6A',
      '--text-inverse': '#0D1B0D',
      '--border-default': '#355C35',
      '--border-hover': '#4A7C4A',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
      '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    },
  },
  'sunset-orange': {
    name: 'Sunset Orange',
    icon: 'mdi--weather-sunset',
    colors: {
      '--bg-primary': '#1A0F0A',
      '--bg-secondary': '#2D1B13',
      '--bg-elevated': '#42291E',
      '--bg-hover': '#573829',
      '--bg-overlay': 'rgba(26, 15, 10, 0.85)',
      '--accent-cyan': '#FF9E40',
      '--accent-cyan-hover': '#FF8A00',
      '--accent-cyan-glow': 'rgba(255, 158, 64, 0.4)',
      '--accent-green': '#FFD54F',
      '--accent-green-hover': '#FFCA28',
      '--accent-green-glow': 'rgba(255, 213, 79, 0.4)',
      '--accent-red': '#FF5252',
      '--accent-red-hover': '#FF1744',
      '--accent-red-glow': 'rgba(255, 82, 82, 0.4)',
      '--accent-amber': '#FFAB40',
      '--accent-amber-hover': '#FF9100',
      '--accent-amber-glow': 'rgba(255, 171, 64, 0.4)',
      '--accent-purple': '#FF6E40',
      '--accent-purple-hover': '#FF3D00',
      '--accent-purple-glow': 'rgba(255, 110, 64, 0.4)',
      '--text-primary': '#FFF3E0',
      '--text-secondary': '#FFCC80',
      '--text-tertiary': '#FFB74D',
      '--text-disabled': '#FFA726',
      '--text-inverse': '#1A0F0A',
      '--border-default': '#573829',
      '--border-hover': '#6D4A3A',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
      '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    },
  },
  'purple-haze': {
    name: 'Purple Haze',
    icon: 'mdi--shimmer',
    colors: {
      '--bg-primary': '#120A1F',
      '--bg-secondary': '#1F1333',
      '--bg-elevated': '#2D1F47',
      '--bg-hover': '#3B2B5C',
      '--bg-overlay': 'rgba(18, 10, 31, 0.85)',
      '--accent-cyan': '#B388FF',
      '--accent-cyan-hover': '#7C4DFF',
      '--accent-cyan-glow': 'rgba(179, 136, 255, 0.4)',
      '--accent-green': '#69F0AE',
      '--accent-green-hover': '#00E676',
      '--accent-green-glow': 'rgba(105, 240, 174, 0.4)',
      '--accent-red': '#FF4081',
      '--accent-red-hover': '#F50057',
      '--accent-red-glow': 'rgba(255, 64, 129, 0.4)',
      '--accent-amber': '#FFD740',
      '--accent-amber-hover': '#FFC400',
      '--accent-amber-glow': 'rgba(255, 215, 64, 0.4)',
      '--accent-purple': '#E040FB',
      '--accent-purple-hover': '#D500F9',
      '--accent-purple-glow': 'rgba(224, 64, 251, 0.4)',
      '--text-primary': '#F3E5F5',
      '--text-secondary': '#CE93D8',
      '--text-tertiary': '#BA68C8',
      '--text-disabled': '#AB47BC',
      '--text-inverse': '#120A1F',
      '--border-default': '#3B2B5C',
      '--border-hover': '#4E3770',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
      '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    },
  },
  'light-mode': {
    name: 'Light Mode',
    icon: 'mdi--white-balance-sunny',
    colors: {
      '--bg-primary': '#F8FAFC',
      '--bg-secondary': '#F1F5F9',
      '--bg-elevated': '#FFFFFF',
      '--bg-hover': '#E2E8F0',
      '--bg-overlay': 'rgba(255, 255, 255, 0.9)',
      '--accent-cyan': '#0EA5E9',
      '--accent-cyan-hover': '#0284C7',
      '--accent-cyan-glow': 'rgba(14, 165, 233, 0.3)',
      '--accent-green': '#10B981',
      '--accent-green-hover': '#059669',
      '--accent-green-glow': 'rgba(16, 185, 129, 0.3)',
      '--accent-red': '#EF4444',
      '--accent-red-hover': '#DC2626',
      '--accent-red-glow': 'rgba(239, 68, 68, 0.3)',
      '--accent-amber': '#F59E0B',
      '--accent-amber-hover': '#D97706',
      '--accent-amber-glow': 'rgba(245, 158, 11, 0.3)',
      '--accent-purple': '#8B5CF6',
      '--accent-purple-hover': '#7C3AED',
      '--accent-purple-glow': 'rgba(139, 92, 246, 0.3)',
      '--text-primary': '#0F172A',
      '--text-secondary': '#475569',
      '--text-tertiary': '#64748B',
      '--text-disabled': '#94A3B8',
      '--text-inverse': '#FFFFFF',
      '--border-default': '#E2E8F0',
      '--border-hover': '#CBD5E1',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    },
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('cryptoscore-theme')
    return (saved as ThemePreset) || 'dark-terminal'
  })

  useEffect(() => {
    const colors = themePresets[theme].colors
    const root = document.documentElement

    // Apply all color variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Save to localStorage
    localStorage.setItem('cryptoscore-theme', theme)
  }, [theme])

  // Keyboard shortcut: Ctrl/Cmd + Shift + T to cycle themes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        const themes = Object.keys(themePresets) as ThemePreset[]
        const currentIndex = themes.indexOf(theme)
        const nextIndex = (currentIndex + 1) % themes.length
        setThemeState(themes[nextIndex])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [theme])

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext value={{ theme, setTheme }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const context = use(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
