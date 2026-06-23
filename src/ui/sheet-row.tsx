/* eslint-disable react-refresh/only-export-components -- row class helper + button */
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function sheetRowButtonClassName(className?: string): string {
  return cn(
    'flex w-full items-center gap-3 border-b border-border-subtle px-6 py-3.5 text-left',
    'cursor-pointer transition-colors hover:bg-muted/55 active:bg-muted/70',
    className,
  )
}

export function SheetRowButton({
  className,
  ...props
}: ComponentProps<'button'>) {
  return <button type="button" className={sheetRowButtonClassName(className)} {...props} />
}
