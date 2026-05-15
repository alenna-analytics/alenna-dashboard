import * as React from "react"

import { cn } from "@/lib/utils"

/** Thin-stroke glyphs for native-sized control (appearance-none). */
const CHECK_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.75 9.5 3.25" stroke="white" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const INDETERMINATE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none"><path d="M2.75 6h6.5" stroke="white" stroke-width="1.15" stroke-linecap="round"/></svg>`

function svgBg(svg: string, sizePx: number): React.CSSProperties {
  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    backgroundSize: `${sizePx}px ${sizePx}px`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }
}

type CheckboxProps = Omit<React.ComponentProps<"input">, "type" | "onChange"> & {
  onCheckedChange?: (checked: boolean) => void
  /** Native mixed state for “some rows selected”. */
  indeterminate?: boolean
}

function Checkbox({
  className,
  checked,
  indeterminate = false,
  onCheckedChange,
  style,
  ...props
}: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  const visuallyOn = !!checked || indeterminate
  const checkOnly = !!checked && !indeterminate

  return (
    <input
      ref={ref}
      type="checkbox"
      role="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-3.5 shrink-0 cursor-pointer appearance-none rounded-[3px] border transition-[border-color,background-color]",
        visuallyOn ? "border-primary bg-primary" : "border-border-default bg-bg-elevated",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      checked={checked}
      style={{
        ...style,
        ...(checkOnly ? svgBg(CHECK_MARK_SVG, 9) : {}),
        ...(indeterminate ? svgBg(INDETERMINATE_SVG, 9) : {}),
      }}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}

export { Checkbox }
