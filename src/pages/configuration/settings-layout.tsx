import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type SettingsSectionHeaderProps = {
  title: string
  description?: string
}

export function SettingsSectionHeader({ title, description }: SettingsSectionHeaderProps) {
  return (
    <div>
      <h2 className="text-base font-semibold tracking-[-0.01em] text-text-primary">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      ) : null}
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
        <p className="mt-0.5 text-sm leading-snug text-text-secondary">{description}</p>
      </div>
      <div className="w-full min-w-0 sm:max-w-sm sm:shrink-0">{children}</div>
    </div>
  )
}
