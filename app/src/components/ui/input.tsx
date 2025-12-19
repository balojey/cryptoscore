import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-lg border px-3 py-2 text-sm transition-all outline-none',
        'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-primary)]',
        'placeholder:text-[var(--text-tertiary)]',
        'focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan)]/20',
        'hover:border-[var(--border-hover)]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bg-primary)]',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--text-primary)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
