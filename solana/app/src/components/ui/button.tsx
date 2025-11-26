import type { VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-cyan)] text-[var(--text-inverse)] hover:bg-[var(--accent-cyan)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
        destructive: 'bg-[var(--accent-red)] text-[var(--text-inverse)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
        success: 'bg-[var(--accent-green)] text-[var(--text-inverse)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]',
        outline: 'border-2 border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]',
        secondary: 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
        ghost: 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]',
        link: 'text-[var(--accent-cyan)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-6 py-3',
        sm: 'px-4 py-2 text-xs',
        lg: 'px-8 py-4 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({ ref, className, variant, size, asChild = false, ...props }: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
}
Button.displayName = 'Button'

export { Button, buttonVariants }
