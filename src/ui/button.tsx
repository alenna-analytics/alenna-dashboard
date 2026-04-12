import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,box-shadow,color,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_14px_24px_rgba(var(--brand-rgb),0.16)] hover:bg-[color:var(--brand-hover)] hover:shadow-[0_18px_28px_rgba(var(--brand-rgb),0.18)]",
        outline:
          "border-border-default bg-bg-elevated text-foreground shadow-[var(--shadow-ink-sm)] hover:bg-bg-surface hover:border-border-emphasis",
        secondary:
          "border-border-subtle bg-glass-fill-muted text-foreground shadow-[var(--shadow-ink-xs)] hover:bg-glass-fill-raised hover:border-border-default",
        ghost:
          "hover:bg-[color:var(--brand-ghost)] hover:text-foreground aria-expanded:bg-brand-dim aria-expanded:text-foreground",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/18 hover:text-destructive",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-1.5 px-5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-8 gap-1 px-3 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1 px-4 text-[0.8rem] in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 in-data-[slot=button-group]:rounded-full",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
