import { Loader2 } from 'lucide-react'

import { APP_ICONS, APP_ICONS_RAW, type AppIconName } from '@/lib/icons/catalog'
import { svgWithCurrentColor } from '@/lib/icons/svg-current-color'
import { cn } from '@/lib/utils'

export type AppIconProps = {
  name: AppIconName
  className?: string
  spin?: boolean
  /** Softens black SVG assets for secondary chrome (header icons). */
  tone?: 'default' | 'muted'
  /** Inline SVG tinted via `currentColor` (sidebar nav). */
  colorize?: boolean
}

export function AppIcon({
  name,
  className,
  spin = false,
  tone = 'default',
  colorize = false,
}: AppIconProps) {
  if (colorize) {
    return (
      <span
        aria-hidden
        className={cn(
          'flex shrink-0 items-center justify-center text-inherit [&_svg]:block [&_svg]:size-full',
          spin && 'animate-spin',
          className,
        )}
        dangerouslySetInnerHTML={{ __html: svgWithCurrentColor(APP_ICONS_RAW[name]) }}
      />
    )
  }

  return (
    <img
      src={APP_ICONS[name]}
      alt=""
      aria-hidden
      draggable={false}
      className={cn(
        'block object-contain',
        tone === 'muted' && 'opacity-55',
        spin && 'animate-spin',
        className,
      )}
    />
  )
}

export type LoadingIconProps = {
  className?: string
}

export function LoadingIcon({ className }: LoadingIconProps) {
  return <Loader2 className={cn('animate-spin', className)} aria-hidden />
}
