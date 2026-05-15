import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-[color-mix(in_srgb,var(--brand)_8%,var(--muted))]",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-[linear-gradient(90deg,transparent,rgba(var(--brand-rgb),0.12),transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
