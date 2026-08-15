import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { createContext, useContext, type ReactNode } from "react"

import { LoadingIcon } from "@/ui/app-icon"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center space-x-2 border text-center font-normal whitespace-nowrap transition-colors duration-200 ease-out outline-none select-none cursor-pointer rounded-md focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        accent:
          "border-[color-mix(in_srgb,var(--zara-base)_70%,var(--firefly-base))] bg-[var(--zara-base)] text-[var(--firefly-base)] hover:border-[var(--firefly-200)] hover:bg-[var(--zara-100)] data-[state=open]:bg-[var(--zara-100)]",
        primary:
          "border-[var(--firefly-200)] bg-[var(--firefly-base)] text-white hover:border-[var(--firefly-300)] hover:bg-[var(--firefly-100)] data-[state=open]:bg-[var(--firefly-100)]",
        success:
          "border-[color-mix(in_srgb,var(--country-green-base)_82%,black)] bg-[var(--country-green-base)] text-white hover:border-[var(--country-green-200)] hover:bg-[var(--country-green-100)] data-[state=open]:bg-[var(--country-green-100)]",
        default:
          "border-[color-mix(in_srgb,var(--country-green-base)_82%,black)] bg-[var(--country-green-base)] text-white hover:border-[var(--country-green-200)] hover:bg-[var(--country-green-100)] data-[state=open]:bg-[var(--country-green-100)]",
        secondary:
          "border-[var(--firefly-200)] bg-[var(--firefly-base)] text-white hover:border-[var(--firefly-300)] hover:bg-[var(--firefly-100)] hover:text-white/90 data-[state=open]:border-[var(--firefly-300)]",
        outline:
          "border-[var(--african-turquoise-100)] bg-transparent text-[var(--firefly-base)] hover:border-[var(--african-turquoise-200)] hover:bg-[var(--platinum-blonde-300)] data-[state=open]:border-[var(--african-turquoise-200)]",
        dashed:
          "border border-dashed border-[var(--border-strong)] bg-transparent text-[var(--firefly-base)] hover:border-[var(--border-emphasis)] data-[state=open]:border-[var(--border-emphasis)]",
        destructive:
          "border-[color-mix(in_srgb,var(--destructive)_45%,white)] bg-[color-mix(in_srgb,var(--destructive)_16%,white)] text-[var(--status-red-900)] hover:border-destructive hover:bg-[color-mix(in_srgb,var(--destructive)_26%,white)] data-[state=open]:border-destructive data-[state=open]:bg-[color-mix(in_srgb,var(--destructive)_26%,white)]",
        danger:
          "border-[color-mix(in_srgb,var(--destructive)_45%,white)] bg-[color-mix(in_srgb,var(--destructive)_16%,white)] text-[var(--status-red-900)] hover:border-destructive hover:bg-[color-mix(in_srgb,var(--destructive)_26%,white)] data-[state=open]:border-destructive data-[state=open]:bg-[color-mix(in_srgb,var(--destructive)_26%,white)]",
        warning:
          "border-[color-mix(in_srgb,var(--warning)_45%,white)] bg-[color-mix(in_srgb,var(--warning)_16%,white)] text-[var(--status-amber-900)] hover:border-warning hover:bg-[color-mix(in_srgb,var(--warning)_26%,white)] data-[state=open]:border-warning data-[state=open]:bg-[color-mix(in_srgb,var(--warning)_26%,white)]",
        ghost:
          "border-transparent bg-transparent text-foreground shadow-none hover:bg-muted hover:text-foreground data-[state=open]:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        text: "border-transparent bg-transparent text-foreground shadow-none hover:bg-muted data-[state=open]:bg-muted",
        link: "rounded-none border-transparent bg-transparent text-[var(--firefly-base)] shadow-none hover:bg-[color-mix(in_srgb,var(--zara-base)_28%,transparent)] data-[state=open]:bg-[color-mix(in_srgb,var(--zara-base)_28%,transparent)]",
        inverse:
          "border-[#2a2a2a] bg-[#1f1f1f] text-white hover:border-[#3a3a3a] hover:bg-[#2a2a2a] data-[state=open]:bg-[#2a2a2a] focus-visible:ring-white/20",
      },
      size: {
        tiny: "h-[26px] space-x-1.5 px-2.5 py-1 text-xs leading-4 [&_svg]:size-[14px]",
        xs: "h-[26px] space-x-1.5 px-2.5 py-1 text-xs leading-4 [&_svg]:size-[14px]",
        small: "h-[34px] px-3 py-2 text-sm leading-4 [&_svg]:size-[18px]",
        sm: "h-[34px] px-3 py-2 text-sm leading-4 [&_svg]:size-[18px]",
        medium: "h-[38px] px-4 py-2 text-sm [&_svg]:size-5",
        md: "h-[38px] px-4 py-2 text-sm [&_svg]:size-5",
        default: "h-[34px] px-3 py-2 text-sm leading-4 [&_svg]:size-[18px]",
        large: "h-[42px] px-4 py-2 text-base [&_svg]:size-5",
        lg: "h-[42px] px-4 py-2 text-base [&_svg]:size-5",
        xlarge: "h-[50px] px-6 py-3 text-base [&_svg]:size-6",
        huge: "h-[50px] px-6 py-3 text-base [&_svg]:size-6",
        icon: "size-[34px] p-0 [&_svg]:size-[18px]",
        "icon-xs": "size-[26px] p-0 [&_svg]:size-[14px]",
        "icon-sm": "size-[34px] p-0 [&_svg]:size-[18px]",
        "icon-lg": "size-[42px] p-0 [&_svg]:size-5",
      },
      block: {
        true: "flex w-full items-center justify-center",
      },
      rounded: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const iconContainerVariants = cva("inline-flex shrink-0 items-center justify-center", {
  variants: {
    size: {
      tiny: "[&_svg]:h-[14px] [&_svg]:w-[14px]",
      xs: "[&_svg]:h-[14px] [&_svg]:w-[14px]",
      small: "[&_svg]:h-[18px] [&_svg]:w-[18px]",
      sm: "[&_svg]:h-[18px] [&_svg]:w-[18px]",
      medium: "[&_svg]:h-[20px] [&_svg]:w-[20px]",
      md: "[&_svg]:h-[20px] [&_svg]:w-[20px]",
      default: "[&_svg]:h-[18px] [&_svg]:w-[18px]",
      large: "[&_svg]:h-[20px] [&_svg]:w-[20px]",
      lg: "[&_svg]:h-[20px] [&_svg]:w-[20px]",
      xlarge: "[&_svg]:h-[24px] [&_svg]:w-[24px]",
      huge: "[&_svg]:h-[24px] [&_svg]:w-[24px]",
      icon: "[&_svg]:h-[18px] [&_svg]:w-[18px]",
      "icon-xs": "[&_svg]:h-[14px] [&_svg]:w-[14px]",
      "icon-sm": "[&_svg]:h-[18px] [&_svg]:w-[18px]",
      "icon-lg": "[&_svg]:h-[20px] [&_svg]:w-[20px]",
    },
  },
})

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>

const loadingIconClassBySize: Record<ButtonSize, string> = {
  tiny: "size-[14px]",
  xs: "size-[14px]",
  small: "size-[18px]",
  sm: "size-[18px]",
  medium: "size-5",
  md: "size-5",
  default: "size-[18px]",
  large: "size-5",
  lg: "size-5",
  xlarge: "size-6",
  huge: "size-6",
  icon: "size-[18px]",
  "icon-xs": "size-[14px]",
  "icon-sm": "size-[18px]",
  "icon-lg": "size-5",
}

function isIconButtonSize(size: ButtonSize): boolean {
  return size === "icon" || size === "icon-xs" || size === "icon-sm" || size === "icon-lg"
}

const ButtonSizeContext = createContext<ButtonSize | null>(null)

type ButtonSizeProviderProps = {
  size: ButtonSize
  children: ReactNode
}

function ButtonSizeProvider({ size, children }: ButtonSizeProviderProps) {
  return <ButtonSizeContext.Provider value={size}>{children}</ButtonSizeContext.Provider>
}

function resolveButtonSize(size: ButtonSize | undefined, contextSize: ButtonSize | null): ButtonSize {
  if (size && isIconButtonSize(size)) return size
  if (contextSize === "tiny") return "tiny"
  return size ?? contextSize ?? "default"
}

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    icon?: ReactNode
    iconLeft?: ReactNode
    iconRight?: ReactNode
  }

function renderIcon(icon: ReactNode, size: ButtonSize) {
  return <span className={iconContainerVariants({ size })}>{icon}</span>
}

function Button({
  className,
  variant = "default",
  size,
  loading = false,
  disabled,
  children,
  icon,
  iconLeft,
  iconRight,
  rounded = false,
  block = false,
  tabIndex,
  ...props
}: ButtonProps) {
  const contextSize = useContext(ButtonSizeContext)
  const resolvedSize = resolveButtonSize(size ?? undefined, contextSize)
  const resolvedVariant: ButtonVariant = variant ?? "default"
  const iconOnly = isIconButtonSize(resolvedSize)
  const leftIcon = icon ?? iconLeft
  const isDisabled = Boolean(disabled || loading)
  const resolvedTabIndex = tabIndex ?? (isDisabled ? -1 : 0)
  const showLeftSlot = loading || Boolean(leftIcon)
  const wrapLabel =
    typeof children === "string" || typeof children === "number" || Boolean(leftIcon || iconRight)

  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      className={cn(
        buttonVariants({ variant: resolvedVariant, size: resolvedSize, rounded, block, className })
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      tabIndex={resolvedTabIndex}
      {...props}
    >
      {showLeftSlot
        ? renderIcon(
            loading ? <LoadingIcon className={loadingIconClassBySize[resolvedSize]} /> : leftIcon,
            resolvedSize
          )
        : null}
      {loading && iconOnly ? null : wrapLabel && children != null ? (
        <span className="min-w-0 truncate">{children}</span>
      ) : (
        children
      )}
      {iconRight && !loading ? renderIcon(iconRight, resolvedSize) : null}
    </ButtonPrimitive>
  )
}

export { Button, ButtonSizeProvider, buttonVariants }
export type { ButtonProps, ButtonSize, ButtonSizeProviderProps, ButtonVariant }
