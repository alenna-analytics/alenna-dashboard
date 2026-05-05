import * as React from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem as CommandItemPrimitive,
  CommandList,
  CommandSeparator,
} from 'cmdk'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

const CommandRoot = React.forwardRef<
  React.ElementRef<typeof Command>,
  React.ComponentPropsWithoutRef<typeof Command>
>(({ className, ...props }, ref) => (
  <Command
    ref={ref}
    className={cn(
      'flex min-h-0 w-full flex-col overflow-hidden rounded-md bg-transparent text-text-primary',
      className
    )}
    {...props}
  />
))
CommandRoot.displayName = 'Command'

const CommandInputWrapper = React.forwardRef<
  React.ElementRef<typeof CommandInput>,
  React.ComponentPropsWithoutRef<typeof CommandInput>
>(({ className, ...props }, ref) => (
  <div
    className="flex shrink-0 items-center border-b border-border-default/80 bg-bg-sunken/40 px-3"
    cmdk-input-wrapper=""
  >
    <Search className="mr-2 size-4 shrink-0 text-text-tertiary" aria-hidden />
    <CommandInput
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-sm bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary dark:placeholder:text-text-secondary/80 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
))
CommandInputWrapper.displayName = 'CommandInputWrapper'

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandItemPrimitive>
>(({ className, ...props }, ref) => (
  <CommandItemPrimitive
    ref={ref}
    className={cn(
      'flex w-full cursor-default items-center gap-2 rounded-none px-3 py-2 text-left text-xs text-text-primary outline-none select-none',
      'aria-selected:bg-brand-dim/70 aria-selected:text-text-primary',
      '[&_svg]:pointer-events-none [&_svg]:shrink-0',
      className
    )}
    {...props}
  />
))
CommandItem.displayName = 'CommandItem'

const CommandListStyled = React.forwardRef<
  React.ElementRef<typeof CommandList>,
  React.ComponentPropsWithoutRef<typeof CommandList>
>(({ className, ...props }, ref) => (
  <CommandList
    ref={ref}
    className={cn(
      'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-0 [scrollbar-color:var(--border-strong)_transparent]',
      className
    )}
    {...props}
  />
))
CommandListStyled.displayName = 'CommandList'

export {
  CommandRoot as Command,
  CommandInputWrapper as CommandInput,
  CommandListStyled as CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
}
