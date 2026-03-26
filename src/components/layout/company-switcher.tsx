import { ChevronDownIcon } from 'lucide-react'

import type { TenantSummary } from '@/auth/hooks'
import { cn } from '@/lib/utils'

type CompanySwitcherProps = {
  tenants: TenantSummary[]
  tenantId: string | null
  onSelect: (tenantId: string) => void
  collapsed?: boolean
  /** Omit the "Company" section label (e.g. sidebar header row). */
  hideLabel?: boolean
  className?: string
}

export function CompanySwitcher({
  tenants,
  tenantId,
  onSelect,
  collapsed,
  hideLabel,
  className,
}: CompanySwitcherProps) {
  if (tenants.length === 0) {
    return null
  }

  if (collapsed) {
    const active = tenants.find((t) => t.tenant_id === tenantId) ?? tenants[0]
    return (
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-sunken font-mono text-xs text-text-secondary',
          className
        )}
        title={active.name}
      >
        {active.name.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  if (tenants.length === 1) {
    const only = tenants[0]
    return (
      <div className={cn('flex w-full flex-col gap-1 px-2', hideLabel && 'px-0', className)}>
        {!hideLabel ? (
          <span className="text-[11px] font-medium tracking-wider text-text-tertiary uppercase">
            Company
          </span>
        ) : null}
        <div className="truncate rounded-lg border border-border-subtle bg-bg-sunken px-2.5 py-2 text-sm text-text-primary">
          {only.name}
        </div>
      </div>
    )
  }

  return (
    <label className={cn('flex w-full flex-col gap-1 px-2', hideLabel && 'px-0', className)}>
      {!hideLabel ? (
        <span className="text-[11px] font-medium tracking-wider text-text-tertiary uppercase">
          Company
        </span>
      ) : null}
      <div className="relative">
        <select
          className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-bg-sunken py-1.5 pr-8 pl-2.5 text-sm text-text-primary outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          value={tenantId ?? ''}
          onChange={(ev) => {
            const v = ev.target.value
            if (v) onSelect(v)
          }}
        >
          <option value="">Select…</option>
          {tenants.map((t) => (
            <option key={t.tenant_id} value={t.tenant_id}>
              {t.name} ({t.role})
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden
        />
      </div>
    </label>
  )
}
