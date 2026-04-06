import { useState } from 'react'
import { ImageOffIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type ProductThumbnailProps = {
  src: string | null | undefined
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClass: Record<NonNullable<ProductThumbnailProps['size']>, string> = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

export function ProductThumbnail({ src, alt, size = 'md', className }: ProductThumbnailProps) {
  const [broken, setBroken] = useState(false)
  const showImg = Boolean(src?.trim()) && !broken

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-muted/40',
        sizeClass[size],
        className,
      )}
    >
      {showImg ? (
        <img
          src={src!.trim()}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-text-tertiary" aria-hidden>
          <ImageOffIcon className="h-1/2 w-1/2 opacity-60" />
        </div>
      )}
    </div>
  )
}
