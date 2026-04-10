import { cn } from '@/lib/utils'

type IntegrationLogoProps = {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const imgSize = {
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-8',
  xl: 'size-14',
}

export function IntegrationLogo({
  src,
  alt,
  size = 'md',
  className,
}: IntegrationLogoProps) {
  const initial = alt.trim().slice(0, 1).toUpperCase() || '?'
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center border border-border-subtle rounded-md',
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className={cn('object-contain', imgSize[size])}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            'flex items-center justify-center font-semibold text-text-secondary',
            imgSize[size],
          )}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <span className="sr-only">{alt}</span>
    </div>
  )
}
