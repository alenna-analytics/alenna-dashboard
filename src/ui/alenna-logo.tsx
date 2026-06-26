import alennaLogo from '@/assets/alenna/alenna-logo.svg'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

export type AlennaLogoProps = {
  className?: string
  variant?: 'default' | 'onDark' | 'atmospheric'
}

export function AlennaLogo({ className, variant = 'default' }: AlennaLogoProps) {
  const { lang } = useLanguage()

  return (
    <img
      src={alennaLogo}
      alt={shellT(lang, 'bootBrandName')}
      decoding="async"
      className={cn(
        'block',
        variant === 'onDark' && 'brightness-0 invert opacity-[0.92]',
        variant === 'atmospheric' &&
          'brightness-0 invert opacity-[0.9] contrast-[0.96] drop-shadow-[0_2px_32px_rgba(255,255,255,0.38)]',
        className,
      )}
    />
  )
}
