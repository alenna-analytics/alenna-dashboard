import { ChevronDownIcon } from 'lucide-react'

import { CurrencyIndicator } from '@/shell/layout/currency-indicator'
import { useDisplayCurrency } from '@/shell/providers/display-currency-provider'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { cn } from '@/lib/utils'
import { chromeTextButtonClassName } from '@/ui/surface'

export function CurrencyPicker({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const {
    baseCurrency,
    displayCurrency,
    effectiveDisplayCurrency,
    multiCurrencyEnabled,
    displayCurrencies,
    latestFx,
    setDisplayCurrency,
    isUpdating,
  } = useDisplayCurrency()

  if (!multiCurrencyEnabled) {
    return <CurrencyIndicator className={className} />
  }

  const ariaLabel = shellT(lang, 'ariaDisplayCurrency')
  const baseUpper = baseCurrency.toUpperCase()
  const effectiveUpper = effectiveDisplayCurrency.toUpperCase()
  const displayUpper = displayCurrency?.toUpperCase() ?? baseUpper
  const noFxRate = effectiveUpper !== baseUpper && latestFx === null
  const optionCodes = displayCurrencies.filter((code) => code !== baseUpper)

  if (noFxRate) {
    return (
      <Tooltip>
        <TooltipTrigger
          className={cn(chromeTextButtonClassName, className)}
          aria-label={ariaLabel}
          disabled
        >
          <span>{displayUpper}</span>
          <ChevronDownIcon className="size-3" />
        </TooltipTrigger>
        <TooltipContent>
          {shellT(lang, 'displayCurrencyPickerNoFxRate')}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(chromeTextButtonClassName, className)}
        aria-label={ariaLabel}
        disabled={isUpdating}
      >
        <span>{displayUpper}</span>
        <ChevronDownIcon className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-auto min-w-32">
        <DropdownMenuItem
          aria-checked={displayUpper === baseUpper}
          onClick={() => void setDisplayCurrency(null)}
        >
          {shellT(lang, 'displayCurrencyOptionBase').replace('{code}', baseUpper)}
        </DropdownMenuItem>
        {optionCodes.map((code) => (
          <DropdownMenuItem
            key={code}
            aria-checked={displayUpper === code}
            onClick={() => void setDisplayCurrency(code)}
          >
            {code}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
