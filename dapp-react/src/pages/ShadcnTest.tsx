import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '../contexts/ThemeContext'

export default function ShadcnTest() {
  const { theme, setTheme } = useTheme()

  const themes = [
    'dark-terminal',
    'ocean-blue',
    'forest-green',
    'sunset-orange',
    'purple-haze',
    'light-mode',
  ] as const

  return (
    <div className="min-h-screen p-8 bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Theme Switcher */}
        <Card>
          <CardHeader>
            <CardTitle>Shadcn UI Component Testing</CardTitle>
            <CardDescription>
              Testing Button, Card, and Badge components with all 6 themes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-[var(--text-secondary)] mb-2">Current Theme: <strong className="text-[var(--text-primary)]">{theme}</strong></p>
                <div className="flex flex-wrap gap-2">
                  {themes.map((t) => (
                    <Button
                      key={t}
                      variant={theme === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>All button variants with hover states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-[var(--text-secondary)] mb-2 text-sm">Default Size</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] mb-2 text-sm">Small Size</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default" size="sm">Default</Button>
                  <Button variant="success" size="sm">Success</Button>
                  <Button variant="destructive" size="sm">Destructive</Button>
                </div>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] mb-2 text-sm">Large Size</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default" size="lg">Default</Button>
                  <Button variant="success" size="lg">Success</Button>
                  <Button variant="destructive" size="lg">Destructive</Button>
                </div>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] mb-2 text-sm">Disabled State</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default" disabled>Disabled</Button>
                  <Button variant="success" disabled>Disabled</Button>
                  <Button variant="destructive" disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Example 1</CardTitle>
              <CardDescription>Basic card with header and content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                This card demonstrates the default styling with proper backgrounds,
                borders, and shadows that adapt to the current theme.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Example 2</CardTitle>
              <CardDescription>Card with footer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                Testing hover effects and transitions. Hover over this card to see
                the border color change and lift animation.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="default" size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Example 3</CardTitle>
              <CardDescription>Card with badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)]">
                  Cards maintain proper contrast and readability across all themes.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Active</Badge>
                  <Badge variant="info">New</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badge Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Variants</CardTitle>
            <CardDescription>All badge variants with proper contrast</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-[var(--text-secondary)] mb-2 text-sm">Status Badges</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] mb-2 text-sm">Market Status Examples</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Open</Badge>
                  <Badge variant="info">Live</Badge>
                  <Badge variant="warning">Ending Soon</Badge>
                  <Badge variant="neutral">Resolved</Badge>
                </div>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] mb-2 text-sm">Prediction Examples</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">HOME</Badge>
                  <Badge variant="neutral">DRAW</Badge>
                  <Badge variant="error">AWAY</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combined Example */}
        <Card>
          <CardHeader>
            <CardTitle>Market Card Example</CardTitle>
            <CardDescription>Simulating a real market card with all components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-[var(--text-primary)]">
                    Manchester United vs Liverpool
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">Premier League</p>
                </div>
                <Badge variant="info">Live</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Pool Size</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">125.5 PAS</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Participants</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">42</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Entry Fee</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">3.0 PAS</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-[var(--text-tertiary)]">Prediction Distribution</p>
                <div className="flex gap-2">
                  <Badge variant="success">HOME 45%</Badge>
                  <Badge variant="neutral">DRAW 20%</Badge>
                  <Badge variant="error">AWAY 35%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="default" className="flex-1">Join Market</Button>
            <Button variant="outline">Details</Button>
          </CardFooter>
        </Card>

        {/* Accessibility & Contrast Check */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Check</CardTitle>
            <CardDescription>Verify text contrast and readability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-[var(--bg-primary)]">
                <p className="text-[var(--text-primary)] font-bold">Primary Text (4.5:1 minimum)</p>
                <p className="text-[var(--text-secondary)]">Secondary Text (4.5:1 minimum)</p>
                <p className="text-[var(--text-tertiary)]">Tertiary Text (3:1 minimum)</p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                <p className="text-[var(--text-primary)] font-bold">Text on Secondary Background</p>
                <p className="text-[var(--text-secondary)]">Should maintain proper contrast</p>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-elevated)]">
                <p className="text-[var(--text-primary)] font-bold">Text on Elevated Background</p>
                <p className="text-[var(--text-secondary)]">Used in cards and modals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
