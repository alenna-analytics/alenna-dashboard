"use client"

import { Switch as SwitchParts } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchParts.Root.Props) {
  return (
    <SwitchParts.Root
      data-slot="switch"
      className={cn(
        "group/switch inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-0 p-0.5 transition-colors outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-checked:bg-secondary",
        "data-unchecked:bg-[rgba(var(--ink-rgb),0.38)]",
        "data-disabled:cursor-not-allowed data-disabled:opacity-45",
        "data-disabled:data-unchecked:bg-[rgba(var(--ink-rgb),0.12)]",
        "data-disabled:data-checked:bg-muted",
        className,
      )}
      {...props}
    >
      <SwitchParts.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full shadow-sm ring-0 transition-transform",
          "data-unchecked:translate-x-0 data-unchecked:bg-[#e4e4e7]",
          "data-checked:translate-x-4 data-checked:bg-white",
          "group-data-disabled/switch:shadow-none group-data-disabled/switch:data-unchecked:bg-[#f4f4f5]",
        )}
      />
    </SwitchParts.Root>
  )
}

export { Switch }
