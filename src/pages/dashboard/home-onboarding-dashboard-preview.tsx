import type { ReactNode } from 'react'

import { shellT } from '@/lib/i18n/shell-strings'

type HomeOnboardingDashboardPreviewProps = {
  lang: string
}

type PreviewTile = {
  labelKey: Parameters<typeof shellT>[1]
  content: ReactNode
}

function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bg-section">
      <div className="absolute inset-0 scale-[1.02] blur-[3px] select-none">{children}</div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-section/90 via-transparent to-transparent" />
    </div>
  )
}

function SalesPreview() {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 h-2 w-16 rounded bg-text-primary/10" />
      <div className="flex flex-1 items-end gap-1.5 pb-1">
        {[42, 68, 54, 82, 61, 74, 48].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-sm"
            style={{
              height: `${height}%`,
              backgroundColor: 'color-mix(in srgb, var(--country-green-base) 35%, transparent)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function MarginsPreview() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="h-2 w-20 rounded bg-text-primary/10" />
      <div className="space-y-2">
        {[88, 72, 56].map((width, index) => (
          <div
            key={index}
            className="h-3 rounded-full"
            style={{
              width: `${width}%`,
              backgroundColor: 'color-mix(in srgb, var(--firefly-base) 12%, transparent)',
            }}
          />
        ))}
      </div>
      <div
        className="mt-auto h-16 rounded-lg"
        style={{ backgroundColor: 'color-mix(in srgb, var(--firefly-base) 8%, transparent)' }}
      />
    </div>
  )
}

function InventoryPreview() {
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="h-2 w-24 rounded bg-text-primary/10" />
      {['warning', 'critical', 'ok'].map((tone, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-lg px-2 py-2"
          style={{
            backgroundColor:
              tone === 'warning'
                ? 'color-mix(in srgb, var(--stock-alert-warning) 12%, white)'
                : tone === 'critical'
                  ? 'color-mix(in srgb, var(--stock-alert-critical) 10%, white)'
                  : 'color-mix(in srgb, var(--country-green-base) 10%, white)',
          }}
        >
          <div className="size-2 rounded-full bg-text-primary/25" />
          <div className="h-2 flex-1 rounded bg-text-primary/10" />
        </div>
      ))}
    </div>
  )
}

function ReportsPreview() {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 h-2 w-20 rounded bg-text-primary/10" />
      <svg viewBox="0 0 200 80" className="h-full w-full" aria-hidden>
        <path
          d="M8 62 C36 48, 52 72, 78 44 S124 18, 192 28"
          fill="none"
          stroke="var(--firefly-base)"
          strokeOpacity="0.35"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M8 72 L192 72"
          stroke="var(--text-primary)"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

const PREVIEW_TILES: PreviewTile[] = [
  { labelKey: 'homeOnboardingPreviewSales', content: <SalesPreview /> },
  { labelKey: 'homeOnboardingPreviewMargins', content: <MarginsPreview /> },
  { labelKey: 'homeOnboardingPreviewInventory', content: <InventoryPreview /> },
  { labelKey: 'homeOnboardingPreviewReports', content: <ReportsPreview /> },
]

export function HomeOnboardingDashboardPreview({ lang }: HomeOnboardingDashboardPreviewProps) {
  return (
    <section className="pb-8 pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-tertiary">
        {shellT(lang, 'homeOnboardingPreviewEyebrow')}
      </p>
      <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">
        {shellT(lang, 'homeOnboardingPreviewTitle')}
      </h2>

      <ul className="mt-8 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PREVIEW_TILES.map((tile) => (
          <li key={tile.labelKey}>
            <PreviewFrame>{tile.content}</PreviewFrame>
            <p className="mt-3 text-sm text-text-secondary">{shellT(lang, tile.labelKey)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
