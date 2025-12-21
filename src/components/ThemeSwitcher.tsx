import type { ThemePreset } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { themePresets, useTheme } from '../contexts/ThemeContext'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Change theme (Ctrl+Shift+T)"
          title="Change theme (Ctrl+Shift+T to cycle)"
          className="gap-2"
        >
          <span className={`icon-[${themePresets[theme].icon}] w-5 h-5`} />
          <span className="hidden sm:inline">{themePresets[theme].name}</span>
          <span className="icon-[mdi--chevron-down] w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
          <p
            className="text-xs mt-1 px-2"
            style={{ color: 'var(--text-disabled)' }}
          >
            Press Ctrl+Shift+T to cycle
          </p>
        </div>

        <DropdownMenuSeparator />

        {(Object.keys(themePresets) as ThemePreset[]).map((presetKey) => {
          const preset = themePresets[presetKey]
          const isActive = theme === presetKey

          return (
            <DropdownMenuItem
              key={presetKey}
              onClick={() => setTheme(presetKey)}
              className="gap-3 py-3 cursor-pointer"
              style={{
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              <span className={`icon-[${preset.icon}] w-5 h-5 flex-shrink-0`} />
              <span className="flex-1">{preset.name}</span>
              {isActive && (
                <span className="icon-[mdi--check] w-5 h-5 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        <div className="px-4 py-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Preview
          </p>
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded-lg border-2"
              style={{
                background: 'var(--accent-cyan)',
                borderColor: 'var(--border-default)',
              }}
              title="Primary Accent"
            />
            <div
              className="w-8 h-8 rounded-lg border-2"
              style={{
                background: 'var(--accent-green)',
                borderColor: 'var(--border-default)',
              }}
              title="Success"
            />
            <div
              className="w-8 h-8 rounded-lg border-2"
              style={{
                background: 'var(--accent-red)',
                borderColor: 'var(--border-default)',
              }}
              title="Error"
            />
            <div
              className="w-8 h-8 rounded-lg border-2"
              style={{
                background: 'var(--accent-amber)',
                borderColor: 'var(--border-default)',
              }}
              title="Warning"
            />
            <div
              className="w-8 h-8 rounded-lg border-2"
              style={{
                background: 'var(--accent-purple)',
                borderColor: 'var(--border-default)',
              }}
              title="Info"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
