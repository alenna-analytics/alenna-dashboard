import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  /** Same flat `--card` / KPI surface (#151a21 dark); no gradient or inset gloss. */
  variant?: "default" | "solid"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-[12px] border border-border-subtle bg-card py-6 text-sm text-card-foreground transition-[box-shadow,border-color] duration-200 ease-out has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 hover:border-border-default hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:hover:border-accent/25 dark:hover:shadow-[0_0_0_1px_rgba(91,140,255,0.12),0_12px_40px_-8px_rgba(0,0,0,0.55)] data-[size=sm]:gap-3 data-[size=sm]:py-4 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-[12px] *:[img:last-child]:rounded-b-[12px]",
        variant === "default" &&
          "bg-gradient-to-b from-white/[0.02] to-transparent shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:from-white/[0.03] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_4px_24px_rgba(0,0,0,0.35)]",
        variant === "solid" &&
          "shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-[12px] px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-sm leading-snug font-medium tracking-tight text-text-primary group-data-[size=sm]/card:text-xs",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-[12px] border-t border-border-subtle bg-muted/40 p-6 group-data-[size=sm]/card:p-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
