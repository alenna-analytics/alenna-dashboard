import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 box-border items-center justify-center gap-1 overflow-hidden rounded border px-1.5 py-1 text-[length:var(--text-micro)] font-medium leading-none whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-none bg-primary/12 text-brand [a]:hover:bg-primary/18",
        secondary:
          "border-none bg-muted/90 text-muted-foreground [a]:hover:bg-muted",
        outline:
          "border-border-subtle bg-transparent text-foreground [a]:hover:bg-muted",
        ghost: "border-transparent hover:bg-muted hover:text-foreground",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
        success:
          "border-none bg-[var(--pill-success-bg)] text-[var(--pill-success-text)] [a]:hover:bg-[color-mix(in_srgb,var(--pill-success-bg)_88%,var(--pill-success-text)_12%)]",
        error:
          "border-none bg-[var(--pill-error-bg)] text-[var(--pill-error-text)] [a]:hover:bg-[color-mix(in_srgb,var(--pill-error-bg)_88%,var(--pill-error-text)_12%)]",
        warning:
          "border-none bg-[var(--pill-warning-bg)] text-[var(--pill-warning-text)] [a]:hover:bg-[color-mix(in_srgb,var(--pill-warning-bg)_88%,var(--pill-warning-text)_12%)]",
        info: "border-none bg-[var(--info-dim)] text-[var(--info)] [a]:hover:bg-info/18",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
