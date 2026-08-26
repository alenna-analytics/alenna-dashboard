import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ChannelBadgeProps = {
  logoSrc?: string | null
  children: ReactNode
  className?: string
}

export function ChannelBadge({ logoSrc, children, className }: ChannelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center justify-center gap-1 rounded-full border border-border-default bg-transparent px-2 text-[length:var(--text-micro)] font-medium leading-none text-text-primary',
        className,
      )}
    >
      {logoSrc ? (
        <img src={logoSrc} alt="" className="size-3.5 shrink-0 object-contain" aria-hidden />
      ) : null}
      <span className="leading-none">{children}</span>
    </span>
  )
}
