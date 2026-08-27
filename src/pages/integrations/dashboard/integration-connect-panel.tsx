import type { ReactNode } from 'react'

type IntegrationConnectPanelProps = {
  description: string
  title: string
  children: ReactNode
  disclaimer: string
  disclaimerExtra?: ReactNode
}

export function IntegrationConnectPanel({
  description,
  title,
  children,
  disclaimer,
  disclaimerExtra,
}: IntegrationConnectPanelProps) {
  return (
    <div className="max-w-xl space-y-6">
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {children}
      </div>
      <div className="space-y-1">
        <p className="text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>
        {disclaimerExtra}
      </div>
    </div>
  )
}
