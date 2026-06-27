"use client"

import { Switch as SwitchParts } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchParts.Root.Props) {
  return (
    <SwitchParts.Root
      data-slot="switch"
      className={cn(
        "group/switch inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent px-0.5 shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-checked:bg-secondary data-unchecked:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-45 data-disabled:data-checked:bg-muted data-disabled:data-unchecked:bg-muted/80 data-disabled:shadow-none",
        className,
      )}
      {...props}
    >
      <SwitchParts.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-glass-fill-knob shadow-sm ring-0 transition-transform data-checked:translate-x-4 data-unchecked:translate-x-0 group-data-disabled/switch:bg-(--platinum-blonde-300) group-data-disabled/switch:shadow-none"
      />
    </SwitchParts.Root>
  )
}

export { Switch }
