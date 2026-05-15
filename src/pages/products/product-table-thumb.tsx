import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

export function ProductTableThumb({ url, alt }: { url: string | null; alt: string }) {
  const [broken, setBroken] = useState(!url)
  if (!url || broken) {
    return (
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-muted/80 text-text-tertiary"
        aria-hidden
      >
        <ImageIcon className="size-4" />
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
