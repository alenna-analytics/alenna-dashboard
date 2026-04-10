import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary [a]:hover:bg-primary/15 dark:bg-primary/15",
        secondary:
          "border-border bg-muted/90 text-muted-foreground [a]:hover:bg-muted",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive [a]:hover:bg-destructive/15 dark:bg-destructive/15",
        outline:
          "border-border bg-transparent text-foreground [a]:hover:bg-muted",
        ghost: "border-transparent hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
        success:
          "border-success/25 bg-[var(--success-dim)] text-success [a]:hover:bg-success/15",
        error:
          "border-destructive/25 bg-destructive/10 text-destructive [a]:hover:bg-destructive/15",
        warning:
          "border-warning/25 bg-[var(--warning-dim)] text-warning [a]:hover:bg-warning/12",
        info: "border-info/25 bg-[var(--info-dim)] text-info [a]:hover:bg-info/12",
        neutral:
          "border-border bg-muted/80 text-muted-foreground [a]:hover:bg-muted",
        blue: "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200 [a]:hover:bg-blue-500/15",
        purple:
          "border-purple-500/20 bg-purple-500/10 text-purple-800 dark:text-purple-200 [a]:hover:bg-purple-500/15",
        orange:
          "border-orange-500/25 bg-orange-500/10 text-orange-900 dark:text-orange-200 [a]:hover:bg-orange-500/15",
        green:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 [a]:hover:bg-emerald-500/15",
        gray: "border-border bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 [a]:hover:bg-neutral-500/15",
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
