import { type HTMLAttributes, forwardRef } from 'react'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm shadow-xl ${className}`}
      {...props}
    />
  )
)
Card.displayName = 'Card'
