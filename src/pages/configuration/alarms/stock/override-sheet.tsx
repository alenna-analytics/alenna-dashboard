import { useMemo, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'
import { fetchAllCatalogProducts } from '@/pages/products/use-catalog-queries'
import type { AlertScopeType, StockOverrideApi } from '@/lib/types/alert-rules'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { PlatformConnection } from '@/lib/types/connectors'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { Switch } from '@/ui/switch'

type OverrideSheetProps = {
  lang: string
  open: boolean
  editing: StockOverrideApi | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: {
    scope_type: AlertScopeType
    scope_id: string | null
    platform_connection_id: string | null
    enabled: boolean
    out_of_stock_enabled: boolean
    velocity_pct: number
  }) => void
}

type OverrideSheetFormProps = {
  lang: string
  editing: StockOverrideApi | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: OverrideSheetProps['onSave']
}

function connectionLabel(lang: string, connection: PlatformConnection): string {
  const ui = INTEGRATION_UI[connection.platform]
  if (ui) return shellT(lang, ui.nameKey)
  return connection.shop_domain?.trim() || connection.platform
}

function initialProductId(editing: StockOverrideApi | null): string {
  if (!editing || editing.scope_type !== 'product') return ''
  return editing.scope_id ?? ''
}

function initialListingId(editing: StockOverrideApi | null): string {
  if (!editing || editing.scope_type !== 'product_listing') return ''
  return editing.scope_id ?? ''
}

function OverrideSheetForm({
  lang,
  editing,
  saving,
  onOpenChange,
  onSave,
}: OverrideSheetFormProps) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const [scopeType, setScopeType] = useState<AlertScopeType>(() => editing?.scope_type ?? 'channel')
  const [connectionId, setConnectionId] = useState(() => editing?.platform_connection_id ?? '')
  const [productId, setProductId] = useState(() => initialProductId(editing))
  const [listingId, setListingId] = useState(() => initialListingId(editing))
  const [enabled, setEnabled] = useState(() => editing?.enabled ?? true)
  const [outOfStockEnabled, setOutOfStockEnabled] = useState(
    () => editing?.out_of_stock_enabled ?? true,
  )
  const [velocityPct, setVelocityPct] = useState(() =>
    editing ? String(Math.round(editing.velocity_pct * 100)) : '20',
  )

  const searchPlaceholder = shellT(lang, 'filterSearch')

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', 'picker-all', tenantId],
    enabled: Boolean(tenantId) && scopeType !== 'channel',
    queryFn: async () => fetchAllCatalogProducts((a) => getToken(a), tenantId),
  })

  const productDetailQuery = useQuery({
    queryKey: ['catalog', 'product-detail', tenantId, productId],
    enabled: Boolean(tenantId) && scopeType === 'product_listing' && Boolean(productId),
    queryFn: async (): Promise<ProductDetailApi> => {
      const res = await apiFetch(
        `/catalog/products/${productId}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductDetailApi
    },
  })

  const selectedConnection = useMemo(
    () => (connectionsQuery.data ?? []).find((item) => item.id === connectionId) ?? null,
    [connectionsQuery.data, connectionId],
  )

  const listingOptions = useMemo(() => {
    const listings = productDetailQuery.data?.listings ?? []
    if (!selectedConnection) return listings
    return listings.filter((listing) => listing.platform === selectedConnection.platform)
  }, [productDetailQuery.data?.listings, selectedConnection])

  const scopeOptions = useMemo(
    (): FilterOption[] => [
      { value: 'channel', label: shellT(lang, 'alarmsScopeChannel') },
      { value: 'product', label: shellT(lang, 'alarmsScopeProduct') },
      { value: 'product_listing', label: shellT(lang, 'alarmsScopeListing') },
    ],
    [lang],
  )

  const connectionOptions = useMemo(
    (): FilterOption[] =>
      (connectionsQuery.data ?? []).map((connection) => ({
        value: connection.id,
        label: connectionLabel(lang, connection),
      })),
    [connectionsQuery.data, lang],
  )

  const productOptions = useMemo(
    (): FilterOption[] =>
      (productsQuery.data ?? []).map((product) => ({
        value: product.id,
        label: product.title?.trim() || product.id,
      })),
    [productsQuery.data],
  )

  const listingFilterOptions = useMemo(
    (): FilterOption[] =>
      listingOptions.map((listing) => ({
        value: listing.id,
        label: listing.platform_title?.trim() || listing.platform_sku || listing.id,
      })),
    [listingOptions],
  )

  const handleSave = () => {
    const parsed = Number(velocityPct)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return
    let scope_id: string | null = null
    let platform_connection_id: string | null = null
    if (scopeType === 'channel') {
      if (!connectionId) return
      platform_connection_id = connectionId
    } else if (scopeType === 'product') {
      if (!productId) return
      scope_id = productId
    } else {
      if (!productId || !connectionId || !listingId) return
      scope_id = listingId
      platform_connection_id = connectionId
    }
    onSave({
      scope_type: scopeType,
      scope_id,
      platform_connection_id,
      enabled,
      out_of_stock_enabled: outOfStockEnabled,
      velocity_pct: parsed / 100,
    })
  }

  const needsConnection = scopeType === 'channel' || scopeType === 'product_listing'
  const needsProduct = scopeType === 'product' || scopeType === 'product_listing'
  const identityLocked = Boolean(editing) || saving

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>
          {editing ? shellT(lang, 'alarmsEditRule') : shellT(lang, 'alarmsAddRule')}
        </SheetTitle>
        <SheetDescription>{shellT(lang, 'alarmsOverrideSheetDescription')}</SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className={cn(identityLocked && 'pointer-events-none opacity-60')}>
          <FilterComboboxSingle
            label={shellT(lang, 'alarmsColScope')}
            options={scopeOptions}
            value={scopeType}
            onValueChange={(value) => {
              if (value === 'channel' || value === 'product' || value === 'product_listing') {
                setScopeType(value)
              }
            }}
            selectionMode="single"
            searchPlaceholder={searchPlaceholder}
            emptyLabel={shellT(lang, 'filterComingSoon')}
            allowClear={false}
            triggerClassName="w-full max-w-none"
            popoverSide="bottom"
          />
        </div>

        {needsConnection ? (
          <div className={cn(identityLocked && 'pointer-events-none opacity-60')}>
            <FilterComboboxSingle
              label={shellT(lang, 'alarmsChannelLabel')}
              options={connectionOptions}
              value={connectionId}
              onValueChange={(value) => {
                setConnectionId(value)
                setListingId('')
              }}
              selectionMode="single"
              searchPlaceholder={searchPlaceholder}
              emptyLabel={shellT(lang, 'alarmsChannelPlaceholder')}
              loading={connectionsQuery.isLoading}
              loadingLabel={shellT(lang, 'alarmsChannelPlaceholder')}
              allowClear={false}
              triggerClassName="w-full max-w-none"
              popoverSide="bottom"
            />
          </div>
        ) : null}

        {needsProduct ? (
          <div className={cn(identityLocked && 'pointer-events-none opacity-60')}>
            <FilterComboboxSingle
              label={shellT(lang, 'alarmsProductLabel')}
              options={productOptions}
              value={productId}
              onValueChange={(value) => {
                setProductId(value)
                setListingId('')
              }}
              selectionMode="single"
              searchPlaceholder={searchPlaceholder}
              emptyLabel={shellT(lang, 'alarmsProductPlaceholder')}
              loading={productsQuery.isLoading}
              loadingLabel={shellT(lang, 'alarmsProductPlaceholder')}
              allowClear={false}
              triggerClassName="w-full max-w-none"
              popoverSide="bottom"
            />
          </div>
        ) : null}

        {scopeType === 'product_listing' ? (
          <div
            className={cn((identityLocked || !productId) && 'pointer-events-none opacity-60')}
          >
            <FilterComboboxSingle
              label={shellT(lang, 'alarmsListingLabel')}
              options={listingFilterOptions}
              value={listingId}
              onValueChange={setListingId}
              selectionMode="single"
              searchPlaceholder={searchPlaceholder}
              emptyLabel={shellT(lang, 'alarmsListingPlaceholder')}
              loading={productDetailQuery.isLoading}
              loadingLabel={shellT(lang, 'alarmsListingPlaceholder')}
              allowClear={false}
              triggerClassName="w-full max-w-none"
              popoverSide="bottom"
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="override-out-of-stock-enabled">
              {shellT(lang, 'alarmsOutOfStockEnabledLabel')}
            </Label>
            <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsOutOfStockEnabledHelp')}</p>
          </div>
          <Switch
            id="override-out-of-stock-enabled"
            checked={outOfStockEnabled}
            onCheckedChange={setOutOfStockEnabled}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="override-enabled">{shellT(lang, 'alarmsLowStockEnabledLabel')}</Label>
            <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsLowStockEnabledHelp')}</p>
          </div>
          <Switch id="override-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={saving} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="override-threshold">{shellT(lang, 'alarmsThresholdLabel')}</Label>
          <div className="flex max-w-xs items-center gap-2">
            <Input
              id="override-threshold"
              type="number"
              min={1}
              max={100}
              value={velocityPct}
              onChange={(e) => setVelocityPct(e.target.value)}
              disabled={saving || !enabled}
            />
            <span className="text-sm text-text-secondary">%</span>
          </div>
        </div>
      </div>

      <SheetFooter>
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
          {shellT(lang, 'alarmsCancel')}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? shellT(lang, 'alarmsSaving') : shellT(lang, 'alarmsSaveRule')}
        </Button>
      </SheetFooter>
    </div>
  )
}

export function OverrideSheet({
  lang,
  open,
  editing,
  saving,
  onOpenChange,
  onSave,
}: OverrideSheetProps) {
  const formKey = editing?.id ?? 'create'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        {open ? (
          <OverrideSheetForm
            key={formKey}
            lang={lang}
            editing={editing}
            saving={saving}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
