import { cn } from '@/lib/utils'

export type SalesChannel = 'shopify' | 'amazon' | 'mercadolibre'

const CHANNEL_STYLES: Record<
  SalesChannel,
  string
> = {
  shopify: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
  amazon: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
  mercadolibre: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-500',
}

const LABELS: Record<SalesChannel, string> = {
  shopify: 'Shopify',
  amazon: 'Amazon',
  mercadolibre: 'Mercado Libre',
}

type ChannelBadgeProps = {
  channel: SalesChannel
  className?: string
}

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        CHANNEL_STYLES[channel],
        className
      )}
    >
      {LABELS[channel]}
    </span>
  )
}
