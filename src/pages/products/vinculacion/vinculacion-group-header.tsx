import { Pencil, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import { cn } from '@/lib/utils'
import { pageTitleClassName } from '@/shell/layout/dashboard-page'
import { AppIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import { ChannelBadge } from '@/ui/channel-badge'
import { Input } from '@/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { productPlatformLabel } from '../product-platform-label'
import { ProductTableThumb } from '../product-table-thumb'

type ShellT = (key: ShellStringKey) => string

type VinculacionGroupHeaderProps = {
  group: ProductLinkGroupApi
  t: ShellT
  title: string
  canEditTitle: boolean
  canAddMember: boolean
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  onAddProduct: () => void
}

function uniqueMemberPlatforms(platforms: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const platform of platforms) {
    const slug = platform.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(platform)
  }
  return out
}

function StatColumn({
  label,
  children,
  valueClassName,
}: {
  label: string
  children: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <span className="whitespace-nowrap text-xs text-text-tertiary">{label}</span>
      <div
        className={cn(
          'flex min-h-8 items-center text-sm font-normal text-text-primary',
          valueClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

function MembersTooltipList({
  group,
  t,
}: {
  group: ProductLinkGroupApi
  t: ShellT
}) {
  return (
    <ul className="max-w-[16rem] space-y-1.5 text-left text-xs leading-snug">
      {group.members.map((member) => {
        const label = member.variant_label?.trim() || member.title
        return (
          <li key={member.product_id}>
            <Link
              to={`/dashboard/products/${member.product_id}`}
              className="block truncate font-medium text-inherit underline-offset-2 hover:underline"
            >
              {label}
            </Link>
            <span className="block truncate text-[11px] opacity-80">
              {productPlatformLabel(member.platform, t)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function VinculacionGroupHeader({
  group,
  t,
  title,
  canEditTitle,
  canAddMember,
  onTitleChange,
  onTitleBlur,
  onAddProduct,
}: VinculacionGroupHeaderProps) {
  const firstMember = group.members[0]
  const thumbUrl = firstMember?.image_url ?? null
  const thumbAlt = firstMember?.title ?? group.title
  const platforms = uniqueMemberPlatforms(group.members.map((member) => member.platform))
  const channelCount = platforms.length
  const productCount = group.members.length

  const thumb = <ProductTableThumb url={thumbUrl} alt={thumbAlt} />

  const stats = (
    <div className="grid w-full grid-cols-2 gap-x-4 gap-y-4 sm:inline-flex sm:max-w-full sm:flex-wrap sm:items-stretch">
      <div className="flex shrink-0 sm:border-border-subtle sm:pr-5">
        <StatColumn label={t('productsDetailHeaderStatChannelsLabel')} valueClassName="tabular-nums">
          {channelCount}
        </StatColumn>
      </div>
      <div className="flex shrink-0 sm:border-l sm:border-border-subtle sm:pl-6 sm:pr-5">
        <StatColumn label={t('productsVinculacionHeaderProductsLabel')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md text-sm font-normal text-text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label={t('productsVinculacionHeaderRelatedHover')}
              >
                <AppIcon name="products" colorize className="size-3.5" />
                <span className="tabular-nums">{productCount}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-left text-xs leading-snug">
              <MembersTooltipList group={group} t={t} />
            </TooltipContent>
          </Tooltip>
        </StatColumn>
      </div>
      {canAddMember ? (
        <div className="col-span-2 flex shrink-0 sm:col-span-1 sm:border-l sm:border-border-subtle sm:pl-6">
          <StatColumn label={'\u00a0'}>
            <Button type="button" variant="accent" size="tiny" onClick={onAddProduct}>
              <Plus aria-hidden />
              {t('productsVinculacionAddProduct')}
            </Button>
          </StatColumn>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:gap-0 sm:space-y-3">
          <div className="shrink-0 sm:hidden">{thumb}</div>
          <div className="min-w-0 space-y-3">
            {canEditTitle ? (
              <div className="flex min-w-0 items-center gap-2">
                <Input
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  onBlur={onTitleBlur}
                  className={cn(
                    pageTitleClassName,
                    'h-auto min-w-0 max-w-xl border-transparent px-0 shadow-none',
                  )}
                  aria-label={group.title}
                />
                <Pencil className="size-4 shrink-0 text-text-tertiary" aria-hidden />
              </div>
            ) : (
              <h1 className={pageTitleClassName}>{group.title}</h1>
            )}

            {platforms.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {platforms.map((platform) => {
                  const slug = platform.trim().toLowerCase()
                  const ui = slug ? INTEGRATION_UI[slug] : undefined
                  return (
                    <ChannelBadge key={platform} logoSrc={ui?.logoSrc}>
                      {productPlatformLabel(platform, t)}
                    </ChannelBadge>
                  )
                })}
              </div>
            ) : null}

            <div className="hidden sm:block">{stats}</div>
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">{thumb}</div>
      </div>

      <div className="sm:hidden">{stats}</div>
    </div>
  )
}
