import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Checkbox({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { ref?: React.RefObject<React.ElementRef<typeof CheckboxPrimitive.Root> | null> }) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded border transition-all',
        'border-[var(--border-default)] bg-[var(--bg-secondary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)]/20 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-[var(--accent-cyan)] data-[state=checked]:border-[var(--accent-cyan)] data-[state=checked]:text-[var(--text-inverse)]',
        'hover:border-[var(--border-hover)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
