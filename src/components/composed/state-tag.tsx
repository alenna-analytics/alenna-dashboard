import { cn } from '@/lib/utils'

type TagTone = 'neutral' | 'good' | 'bad' | 'shopify' | 'amazon' | 'mercadolibre'

type StateTagProps = {
  label: string
  tone?: TagTone
  className?: string
}

const TONE_CLASS: Record<TagTone, string> = {
  neutral:
    'border-slate-500/35 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/10 dark:text-slate-200',
  good:
    'border-emerald-500/45 bg-emerald-100 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-400/12 dark:text-emerald-300',
  bad:
    'border-rose-500/45 bg-rose-100 text-rose-800 dark:border-rose-400/35 dark:bg-rose-400/12 dark:text-rose-300',
  shopify:
    'border-emerald-500/45 bg-emerald-100 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-400/12 dark:text-emerald-300',
  amazon:
    'border-blue-500/45 bg-blue-100 text-blue-800 dark:border-blue-400/35 dark:bg-blue-400/12 dark:text-blue-300',
  mercadolibre:
    'border-yellow-500/45 bg-yellow-100 text-yellow-800 dark:border-yellow-300/40 dark:bg-yellow-300/14 dark:text-yellow-200',
}

export function StateTag({ label, tone = 'neutral', className }: StateTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}
