import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-zinc-200/85 dark:bg-zinc-700/45",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.24),transparent)]",
        "dark:before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
