"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

const sheetHeaderClassName =
  "flex h-[var(--shell-chrome-header-height)] min-h-[var(--shell-chrome-header-height)] max-h-[var(--shell-chrome-header-height)] shrink-0 items-center border-[var(--shell-divider)] bg-white px-4"

const sheetFooterClassName =
  "flex h-[var(--shell-sheet-footer-height)] min-h-[var(--shell-sheet-footer-height)] max-h-[var(--shell-sheet-footer-height)] shrink-0 items-center border-[var(--shell-divider)] bg-white px-4"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-overlay-scrim duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: "right" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex h-full min-h-0 flex-col gap-0 overflow-hidden bg-white p-0 text-sm shadow-none ring-0 duration-200 outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
          side === "right" &&
            "inset-y-0 right-0 w-full max-w-[var(--shell-sheet-width)] border-l border-[var(--shell-divider)] data-closed:slide-out-to-right data-open:slide-in-from-right",
          side === "left" &&
            "top-3 left-3 bottom-3 h-auto max-h-[calc(100dvh-1.5rem)] w-full rounded-md border border-[var(--shell-divider)] data-closed:slide-out-to-left data-open:slide-in-from-left sm:top-4 sm:left-4 sm:bottom-4 sm:max-h-[calc(100dvh-2rem)]",
          className,
        )}
        {...props}
      >
        <div className="flex h-full min-h-0 flex-col">{children}</div>
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(sheetHeaderClassName, "border-b", className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto bg-white px-6 py-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(sheetFooterClassName, "mt-auto justify-end gap-2 border-t", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("min-w-0 truncate font-heading text-base font-semibold text-text-primary", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
