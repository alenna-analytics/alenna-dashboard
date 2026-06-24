import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'

export function AppToaster() {
  return (
    <Toaster
      className="alenna-sonner"
      position="bottom-right"
      closeButton
      theme="light"
      icons={{
        success: <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden strokeWidth={2} />,
        error: <XCircle className="size-5 shrink-0 text-red-600" aria-hidden strokeWidth={2} />,
        warning: <AlertTriangle className="size-5 shrink-0 text-amber-500" aria-hidden strokeWidth={2} />,
        info: <Info className="size-5 shrink-0 text-sky-600" aria-hidden strokeWidth={2} />,
      }}
      toastOptions={{
        classNames: {
          toast:
            '!border !border-solid !bg-white !text-text-primary shadow-[var(--shadow-ink-sm)] [&_[data-title]]:!text-text-primary',
          title: '!text-text-primary',
          description: '!text-text-secondary',
          default: '!border-[color-mix(in_srgb,var(--brand)_35%,var(--border-default))]',
          success: '!border-primary',
          error: '!border-red-600',
          warning: '!border-amber-500',
          info: '!border-sky-600',
          closeButton:
            '!border-border-subtle !bg-white !text-text-secondary hover:!bg-muted/60 hover:!text-text-primary',
          icon: '!size-5 !min-w-5 [&_svg]:!size-5',
        },
      }}
    />
  )
}
