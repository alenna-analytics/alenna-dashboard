import * as React from "react"

import { cn } from "@/lib/utils"

type CheckboxProps = Omit<React.ComponentProps<"input">, "type" | "onChange"> & {
  onCheckedChange?: (checked: boolean) => void
}

function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      role="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer rounded-md border border-border-default bg-bg-elevated accent-primary",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}

export { Checkbox }
