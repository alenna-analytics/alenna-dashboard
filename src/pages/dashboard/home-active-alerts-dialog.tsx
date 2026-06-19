import { Link } from 'react-router-dom'
import { LoadingIcon } from '@/ui/app-icon'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertPostponeDuration } from '@/lib/types/alerts'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

type HomeActiveAlertsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeItems: AlertItemApi[]
  postponedItems: AlertItemApi[]
  activeLoading: boolean
  postponedLoading: boolean
  isAdmin: boolean
  postponePending: boolean
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
  t: (key: ShellStringKey) => string
}

function severityClass(severity: AlertItemApi['severity']): string {
  if (severity === 'critical') return 'text-[var(--stock-alert-critical)]'
  if (severity === 'low') return 'text-[var(--stock-alert-warning)]'
  return 'text-muted-foreground'
}

function AlertRowItem({
  item,
  isAdmin,
  postponePending,
  onPostpone,
  t,
}: {
  item: AlertItemApi
  isAdmin: boolean
  postponePending: boolean
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
  t: (key: ShellStringKey) => string
}) {
  const productHref = item.product_id ? `/dashboard/products/${item.product_id}` : null

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-subtle px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-sm font-medium leading-snug', severityClass(item.severity))}>
            {item.title}
          </p>
          {item.platform_sku ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.platform_sku}</p>
          ) : null}
        </div>
        {productHref ? (
          <Link
            to={productHref}
            className="shrink-0 text-xs font-medium text-primary underline underline-offset-2"
          >
            {t('homeAlertsDialogViewProduct')}
          </Link>
        ) : null}
      </div>
      {isAdmin ? (
        <div className="flex flex-wrap gap-2">
          {(['1h', '1d', '1w'] as const).map((duration) => (
            <Button
              key={duration}
              type="button"
              variant="outline"
              size="sm"
              disabled={postponePending}
              onClick={() => onPostpone(item.id, duration)}
            >
              {t(
                duration === '1h'
                  ? 'homeAlertsDialogPostpone1h'
                  : duration === '1d'
                    ? 'homeAlertsDialogPostpone1d'
                    : 'homeAlertsDialogPostpone1w',
              )}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function AlertSectionBlock({
  title,
  emptyLabel,
  items,
  loading,
  isAdmin,
  postponePending,
  onPostpone,
  t,
}: {
  title: string
  emptyLabel: string
  items: AlertItemApi[]
  loading: boolean
  isAdmin: boolean
  postponePending: boolean
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
  t: (key: ShellStringKey) => string
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <LoadingIcon className="size-4" />
          {t('homeAlertsDialogLoading')}
        </div>
      ) : items.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <AlertRowItem
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              postponePending={postponePending}
              onPostpone={onPostpone}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function HomeActiveAlertsDialog({
  open,
  onOpenChange,
  activeItems,
  postponedItems,
  activeLoading,
  postponedLoading,
  isAdmin,
  postponePending,
  onPostpone,
  t,
}: HomeActiveAlertsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('homeAlertsDialogTitle')}</DialogTitle>
          <DialogDescription>{t('homeAlertsDialogDescription')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <AlertSectionBlock
            title={t('homeAlertsDialogActiveSection')}
            emptyLabel={t('homeAlertsDialogActiveEmpty')}
            items={activeItems}
            loading={activeLoading}
            isAdmin={isAdmin}
            postponePending={postponePending}
            onPostpone={onPostpone}
            t={t}
          />
          <AlertSectionBlock
            title={t('homeAlertsDialogPostponedSection')}
            emptyLabel={t('homeAlertsDialogPostponedEmpty')}
            items={postponedItems}
            loading={postponedLoading}
            isAdmin={isAdmin}
            postponePending={postponePending}
            onPostpone={onPostpone}
            t={t}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
