import { Loader2 } from 'lucide-react'

import { APP_ICONS, type AppIconName } from '@/lib/icons/catalog'
import { cn } from '@/lib/utils'

export type AppIconProps = {
  name: AppIconName
  className?: string
  spin?: boolean
}

export function AppIcon({ name, className, spin = false }: AppIconProps) {
  return (
    <img
      src={APP_ICONS[name]}
      alt=""
      aria-hidden
      draggable={false}
      className={cn('block object-contain', spin && 'animate-spin', className)}
    />
  )
}

export type LoadingIconProps = {
  className?: string
}

export function LoadingIcon({ className }: LoadingIconProps) {
  return <Loader2 className={cn('animate-spin', className)} aria-hidden />
}
