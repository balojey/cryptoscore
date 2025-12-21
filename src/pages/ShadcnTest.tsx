import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from '../contexts/ThemeContext'

export default function ShadcnTest() {
  const { theme, setTheme } = useTheme()
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [checked, setChecked] = useState(false)

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
                <p className="text-[var(--text-secondary)] mb-2">
                  Current Theme:
                  <strong className="text-[var(--text-primary)]">{theme}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {themes.map(t => (
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

        {/* Form Components */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>Input, Select, and Checkbox with theme integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Input Examples */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Input Component</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Text Input</label>
                    <Input
                      type="text"
                      placeholder="Enter text..."
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Number Input</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Email Input</label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Disabled Input</label>
                    <Input
                      type="text"
                      placeholder="Disabled"
                      disabled
                      value="Cannot edit"
                    />
                  </div>
                </div>
              </div>

              {/* Select Examples */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Select Component</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Market Status</label>
                    <Select value={selectValue} onValueChange={setSelectValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Markets</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Prediction</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prediction..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">HOME</SelectItem>
                        <SelectItem value="draw">DRAW</SelectItem>
                        <SelectItem value="away">AWAY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Sort By</label>
                    <Select>
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="ending">Ending Soon</SelectItem>
                        <SelectItem value="pool">Highest Pool</SelectItem>
                        <SelectItem value="participants">Most Participants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)]">Disabled Select</label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Disabled" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option">Option</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Checkbox Examples */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Checkbox Component</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={checked}
                      onCheckedChange={checked => setChecked(checked as boolean)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm text-[var(--text-primary)] cursor-pointer"
                    >
                      I agree to the terms and conditions
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="private" />
                    <label
                      htmlFor="private"
                      className="text-sm text-[var(--text-primary)] cursor-pointer"
                    >
                      Make this market private
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notifications" defaultChecked />
                    <label
                      htmlFor="notifications"
                      className="text-sm text-[var(--text-primary)] cursor-pointer"
                    >
                      Enable notifications (default checked)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="disabled" disabled />
                    <label
                      htmlFor="disabled"
                      className="text-sm text-[var(--text-primary)] opacity-50 cursor-not-allowed"
                    >
                      Disabled checkbox
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="disabled-checked" disabled checked />
                    <label
                      htmlFor="disabled-checked"
                      className="text-sm text-[var(--text-primary)] opacity-50 cursor-not-allowed"
                    >
                      Disabled and checked
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Example */}
              <div className="space-y-3 pt-4 border-t border-[var(--border-default)]">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Complete Form Example</p>
                <div className="space-y-4 p-4 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--text-primary)] font-medium">Market Name</label>
                    <Input type="text" placeholder="e.g., Manchester United vs Liverpool" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--text-primary)] font-medium">Entry Fee (PAS)</label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[var(--text-primary)] font-medium">League</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select league..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premier">Premier League</SelectItem>
                          <SelectItem value="laliga">La Liga</SelectItem>
                          <SelectItem value="bundesliga">Bundesliga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="form-private" />
                    <label htmlFor="form-private" className="text-sm text-[var(--text-primary)] cursor-pointer">
                      Make this market private
                    </label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="default">Create Market</Button>
                    <Button variant="outline">Cancel</Button>
                  </div>
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

        {/* Animation & Utility Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Animations & Utility Classes</CardTitle>
            <CardDescription>Testing animations and utility classes with Shadcn UI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Entrance Animations */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Entrance Animations</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="animate-fade-in">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Fade In</p>
                      <p className="text-xs text-[var(--text-secondary)]">.animate-fade-in</p>
                    </CardContent>
                  </Card>
                  <Card className="animate-slide-in-right">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Slide In Right</p>
                      <p className="text-xs text-[var(--text-secondary)]">.animate-slide-in-right</p>
                    </CardContent>
                  </Card>
                  <Card className="animate-scale-in">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Scale In</p>
                      <p className="text-xs text-[var(--text-secondary)]">.animate-scale-in</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Hover Effects */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Hover Effects</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="hover-lift">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Hover Lift</p>
                      <p className="text-xs text-[var(--text-secondary)]">.hover-lift</p>
                    </CardContent>
                  </Card>
                  <Card className="hover-glow">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Hover Glow</p>
                      <p className="text-xs text-[var(--text-secondary)]">.hover-glow</p>
                    </CardContent>
                  </Card>
                  <Card className="hover-lift hover-glow">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Combined</p>
                      <p className="text-xs text-[var(--text-secondary)]">.hover-lift .hover-glow</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Glow Effects */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Glow Effects</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default" className="glow-cyan">Cyan Glow</Button>
                  <Button variant="success" className="glow-green">Green Glow</Button>
                  <Button variant="destructive" className="glow-red">Red Glow</Button>
                </div>
              </div>

              {/* Glassmorphism */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Glassmorphism Effect</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Regular Card</p>
                      <p className="text-xs text-[var(--text-secondary)]">Standard background</p>
                    </CardContent>
                  </Card>
                  <Card className="card-glass">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Glass Card</p>
                      <p className="text-xs text-[var(--text-secondary)]">.card-glass with backdrop blur</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Loading States */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Loading States</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="skeleton h-4 w-3/4 rounded"></div>
                      <div className="skeleton h-4 w-1/2 rounded"></div>
                      <div className="skeleton h-4 w-5/6 rounded"></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center justify-center">
                      <div className="spinner"></div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Attention Animations */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Attention Animations</p>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="info" className="animate-pulse-glow">Live Market</Badge>
                  <Button variant="default" className="animate-bounce-in">Success!</Button>
                  <Button variant="destructive" className="animate-shake">Error</Button>
                </div>
              </div>

              {/* Combined Effects */}
              <div className="space-y-3">
                <p className="text-[var(--text-secondary)] text-sm font-semibold">Combined Effects</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="card-glass hover-lift animate-fade-in">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Glass + Lift + Fade</p>
                      <p className="text-xs text-[var(--text-secondary)]">Multiple utility classes</p>
                    </CardContent>
                  </Card>
                  <Card className="hover-lift hover-glow animate-scale-in">
                    <CardContent className="p-4">
                      <p className="text-sm text-[var(--text-primary)] font-medium">Lift + Glow + Scale</p>
                      <p className="text-xs text-[var(--text-secondary)]">Smooth transitions</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
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
