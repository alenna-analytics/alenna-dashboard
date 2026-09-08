import { useEffect, useRef, useState } from 'react'
import { MoreVertical, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import { cn } from '@/lib/utils'
import { pageTitleClassName } from '@/shell/layout/dashboard-page'
import { AppIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import { ChannelBadge } from '@/ui/channel-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Input } from '@/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { productPlatformLabel } from '../product-platform-label'

type ShellT = (key: ShellStringKey) => string

type VinculacionGroupHeaderProps = {
  group: ProductLinkGroupApi
  t: ShellT
  title: string
  canEditTitle: boolean
  canAddMember: boolean
  canDissolve: boolean
  onTitleChange: (value: string) => void
  onTitleDiscard: () => void
  onAddProduct: () => void
  onDissolve: () => void
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
  canDissolve,
  onTitleChange,
  onTitleDiscard,
  onAddProduct,
  onDissolve,
}: VinculacionGroupHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const platforms = uniqueMemberPlatforms(group.members.map((member) => member.platform))
  const channelCount = platforms.length
  const productCount = group.members.length
  const showActions = canAddMember || canEditTitle || canDissolve

  useEffect(() => {
    if (!editingTitle) return
    const input = titleInputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [editingTitle])

  const startRename = () => {
    if (!canEditTitle) return
    setEditingTitle(true)
  }

  const titleShellClassName = cn(pageTitleClassName, 'box-border block w-full max-w-xl')
  const titleEditableClassName = cn(
    titleShellClassName,
    'cursor-text text-left underline decoration-dotted decoration-text-tertiary/70 underline-offset-4 transition-colors hover:text-text-secondary',
  )
  const titleInputClassName = cn(
    titleShellClassName,
    'h-9 rounded-md border border-border-default bg-white px-2 py-0 leading-9 shadow-none',
    'focus-visible:ring-0 focus-visible:ring-offset-0',
  )

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
    </div>
  )

  const actions = showActions ? (
    <div className="flex shrink-0 items-center gap-2">
      {canAddMember ? (
        <Button type="button" variant="accent" size="tiny" onClick={onAddProduct}>
          <Plus aria-hidden />
          {t('productsVinculacionAddProduct')}
        </Button>
      ) : null}
      {canEditTitle || canDissolve ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md border border-border-default bg-white text-text-primary outline-none',
              'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
            )}
            aria-label={t('productsVinculacionMoreActions')}
          >
            <MoreVertical className="size-4 shrink-0" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('productsTableActions')}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {canEditTitle ? (
                <DropdownMenuItem onClick={startRename}>
                  <span>{t('productsVinculacionRename')}</span>
                </DropdownMenuItem>
              ) : null}
              {canDissolve ? (
                <DropdownMenuItem variant="destructive" onClick={onDissolve}>
                  <span>{t('productsVinculacionDissolve')}</span>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  ) : null

  return (
    <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          {canEditTitle ? (
            <div className="relative max-w-xl min-h-9">
              <span
                className={cn(titleShellClassName, 'invisible block min-h-9 select-none leading-9')}
                aria-hidden
              >
                {title || '\u00A0'}
              </span>
              {editingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur()
                    }
                    if (event.key === 'Escape') {
                      onTitleDiscard()
                      setEditingTitle(false)
                    }
                  }}
                  className={cn(titleInputClassName, 'absolute inset-y-0 left-0')}
                  aria-label={group.title}
                />
              ) : (
                <button
                  type="button"
                  className={cn(titleEditableClassName, 'absolute inset-0 min-h-9 leading-9')}
                  onClick={startRename}
                >
                  {title}
                </button>
              )}
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
        {actions}
      </div>

      <div className="sm:hidden">{stats}</div>
    </div>
  )
}
