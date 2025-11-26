import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--accent-cyan)] text-[var(--text-inverse)]',
        success: 'border-transparent bg-[var(--accent-green)] text-[var(--text-inverse)]',
        error: 'border-transparent bg-[var(--accent-red)] text-[var(--text-inverse)]',
        warning: 'border-transparent bg-[var(--accent-amber)] text-[var(--text-inverse)]',
        info: 'border-transparent bg-[var(--accent-purple)] text-[var(--text-inverse)]',
        neutral: 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
        outline: 'border-[var(--border-default)] text-[var(--text-primary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
