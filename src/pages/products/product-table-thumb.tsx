import { useState } from 'react'

import alennaIcon from '@/assets/alenna/alenna-icon-black.svg'
import { cn } from '@/lib/utils'

export function ProductTableThumb({ url, alt }: { url: string | null; alt: string }) {
  const [broken, setBroken] = useState(!url)
  if (!url || broken) {
    return (
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-muted/80"
        aria-hidden
      >
        <img
          src={alennaIcon}
          alt=""
          className="size-5 opacity-40 grayscale"
          decoding="async"
        />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      className="size-10 shrink-0 rounded-md border border-border-subtle object-cover"
      loading="lazy"
      onError={() => setBroken(true)}
    />
  )
}

export function ProductDetailHeaderThumb({
  url,
  title,
  className,
}: {
  url: string | null
  title: string
  className?: string
}) {
  const [broken, setBroken] = useState(!url)
  const thumbClass =
    className ??
    'size-20 shrink-0 rounded-md border border-border-subtle object-cover sm:size-[150px]'
  if (!url || broken) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/50',
          thumbClass,
        )}
        aria-hidden
      >
        <img
          src={alennaIcon}
          alt=""
          className="size-10 opacity-40 grayscale sm:size-14"
          decoding="async"
        />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      className={thumbClass}
      width={150}
      height={150}
      sizes="(max-width: 640px) 80px, 150px"
      loading="eager"
      onError={() => setBroken(true)}
    />
  )
}
