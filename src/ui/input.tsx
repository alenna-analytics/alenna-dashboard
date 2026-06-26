import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  /** Use inside a bordered wrapper (e.g. affix); no border, shadow, or focus ring. */
  variant?: "default" | "bare"
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        variant === "default" &&
        "h-[33px] w-full min-w-0 rounded-md border border-border-default bg-white px-2 py-1 text-sm outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-glass-fill-subtle disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/25",
        variant === "bare" &&
        "min-h-0 w-full min-w-0 rounded-md border-0 bg-transparent px-2 py-1 text-sm shadow-none outline-none ring-0 file:border-0 file:bg-transparent placeholder:text-muted-foreground focus:border-0 focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
