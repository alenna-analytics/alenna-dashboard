import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const settingsSectionTitleClassName =
  'text-base font-semibold tracking-[-0.01em] text-text-primary'
export const settingsDescriptionClassName = 'text-xs leading-relaxed text-text-tertiary'
export const dangerActionCardClassName =
  'rounded-lg border border-[#fdd8d3] bg-white p-4'

type SettingsSectionHeaderProps = {
  title: string
  description?: string
  aside?: ReactNode
  className?: string
}

export function SettingsSectionHeader({
  title,
  description,
  aside,
  className,
}: SettingsSectionHeaderProps) {
  return (
    <div className={className}>
      {aside ? (
        <div className="flex items-start justify-between gap-3">
          <h2 className={settingsSectionTitleClassName}>{title}</h2>
          {aside}
        </div>
      ) : (
        <h2 className={settingsSectionTitleClassName}>{title}</h2>
      )}
      {description ? <p className={cn('mt-1', settingsDescriptionClassName)}>{description}</p> : null}
    </div>
  )
}

type SettingsCardProps = {
  children: ReactNode
  className?: string
}

export function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border border-border-card bg-white divide-y divide-border-card',
        className,
      )}
    >
      {children}
    </div>
  )
}

type SettingsRowProps = {
  label: string
  description: string
  children: ReactNode
}

export function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className={cn('mt-1', settingsDescriptionClassName)}>{description}</p>
      </div>
      <div className="w-full min-w-0 sm:max-w-sm sm:shrink-0">{children}</div>
    </div>
  )
}
