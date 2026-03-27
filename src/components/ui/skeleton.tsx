import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-[#dbe7ff]/55 dark:bg-card",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-[linear-gradient(90deg,transparent,rgba(91,140,255,0.12),transparent)]",
        "dark:before:bg-[linear-gradient(90deg,transparent,rgba(124,163,255,0.14),transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
