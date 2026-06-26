import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap shadow-none transition-[background-color,border-color,box-shadow,color,transform] outline-none select-none focus-visible:border-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:cursor-pointer hover:shadow-none",
  {
    variants: {
      variant: {
        accent:
          "bg-[var(--zara-base)] text-[var(--firefly-base)] hover:bg-[var(--zara-100)]",
        primary:
          "bg-[var(--firefly-base)] text-white hover:bg-[var(--firefly-100)]",
        success:
          "bg-[var(--country-green-base)] text-white hover:bg-[var(--country-green-100)]",
        outline:
          "border-[var(--african-turquoise-100)] bg-white text-[var(--firefly-base)] hover:bg-[var(--platinum-blonde-300)]",
        destructive:
          "border-[var(--status-red-200)] bg-[var(--status-red-50)] text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--status-red-50)_88%,var(--status-red-200)_12%)]",
        default:
          "bg-[var(--country-green-base)] text-white hover:bg-[var(--country-green-100)]",
        secondary:
          "bg-[var(--firefly-base)] text-white hover:bg-[var(--firefly-100)]",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[33px] gap-1.5 px-2 text-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        sm: "gap-1 px-2.5 py-1 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-[33px] gap-1.5 px-2 text-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-12 gap-1.5 px-2.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-6 rounded [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-6 rounded [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-6 rounded [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-md",
        xs: "h-8 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
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
