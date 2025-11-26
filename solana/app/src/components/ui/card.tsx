import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] transition-all hover:border-[var(--border-hover)] hover:-translate-y-0.5',
        className,
      )}
      {...props}
    />
  )
}
Card.displayName = 'Card'

function CardHeader({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6 pb-4 border-b border-[var(--border-default)]', className)}
      {...props}
    />
  )
}
CardHeader.displayName = 'CardHeader'

function CardTitle({ ref, className, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) {
  return (
    <h3
      ref={ref}
      className={cn(
        'text-xl font-bold text-[var(--text-primary)]',
        className,
      )}
      {...props}
    />
  )
}
CardTitle.displayName = 'CardTitle'

function CardDescription({ ref, className, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--text-secondary)]', className)}
      {...props}
    />
  )
}
CardDescription.displayName = 'CardDescription'

function CardContent({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return <div ref={ref} className={cn('p-6 text-[var(--text-secondary)]', className)} {...props} />
}
CardContent.displayName = 'CardContent'

function CardFooter({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center px-6 py-4 border-t border-[var(--border-default)]', className)}
      {...props}
    />
  )
}
CardFooter.displayName = 'CardFooter'

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
