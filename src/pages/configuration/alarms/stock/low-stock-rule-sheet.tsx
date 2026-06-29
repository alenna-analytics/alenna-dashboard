import { useMemo, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { connectionLabel } from '@/lib/integrations/connection-label'
import { shellT } from '@/lib/i18n/shell-strings'
import { fetchAllCatalogProducts } from '@/pages/products/use-catalog-queries'
import type { AlertScopeType, StockOverrideApi, StockRuleApi } from '@/lib/types/alert-rules'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { PlatformConnection } from '@/lib/types/connectors'
import { cn } from '@/lib/utils'
import { LoadingIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

type LowStockRuleScopeType = Extract<AlertScopeType, 'channel' | 'product' | 'product_listing'>

type LowStockRuleSheetProps = {
  lang: string
  open: boolean
  editing: StockOverrideApi | null
  rule: StockRuleApi | undefined
  saving: boolean
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: {
    scope_type: LowStockRuleScopeType
    scope_id: string | null
    platform_connection_id: string | null
    enabled: boolean
    velocity_pct: number
  }) => void
  onDelete: () => Promise<void>
}

type LowStockRuleSheetFormProps = Omit<LowStockRuleSheetProps, 'open'> & {
  onOpenChange: (open: boolean) => void
}

function initialScopeType(editing: StockOverrideApi | null): LowStockRuleScopeType {
  if (editing?.scope_type === 'channel') return 'channel'
  if (editing?.scope_type === 'product_listing') return 'product_listing'
  return 'product'
}

function listingLabelFromScopeLabel(scopeLabel: string): string {
  const separator = ' · '
  const lastSeparatorIndex = scopeLabel.lastIndexOf(separator)
  if (lastSeparatorIndex === -1) return scopeLabel
  return scopeLabel.slice(0, lastSeparatorIndex)
}

function initialProductId(editing: StockOverrideApi | null): string {
  if (!editing || editing.scope_type === 'channel') return ''
  if (editing.scope_type === 'product') return editing.scope_id ?? ''
  if (editing.scope_type === 'product_listing') return editing.product_id ?? ''
  return ''
}

function initialListingId(editing: StockOverrideApi | null): string {
  if (!editing || editing.scope_type !== 'product_listing') return ''
  return editing.scope_id ?? ''
}

function LowStockRuleSheetForm({
  lang,
  editing,
  rule,
  saving,
  deleting,
  onOpenChange,
  onSave,
  onDelete,
}: LowStockRuleSheetFormProps) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const [scopeType, setScopeType] = useState<LowStockRuleScopeType>(() => initialScopeType(editing))
  const [connectionId, setConnectionId] = useState(() => editing?.platform_connection_id ?? '')
  const [productId, setProductId] = useState(() => initialProductId(editing))
  const [listingId, setListingId] = useState(() => initialListingId(editing))
  const [velocityPct, setVelocityPct] = useState(() =>
    editing
      ? String(Math.round(editing.velocity_pct * 100))
      : String(Math.round((rule?.velocity_pct ?? 0.2) * 100)),
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const searchPlaceholder = shellT(lang, 'filterSearch')

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId) && (scopeType === 'channel' || scopeType === 'product_listing'),
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

  const productOptions = useMemo((): FilterOption[] => {
    const options = (productsQuery.data ?? []).map((product) => ({
      value: product.id,
      label: product.title?.trim() || product.id,
    }))

    if (productId && !options.some((option) => option.value === productId)) {
      const detailTitle =
        productDetailQuery.data?.title?.trim() || productDetailQuery.data?.parent_title?.trim()
      if (detailTitle) {
        options.unshift({
          value: productId,
          label: detailTitle,
        })
      }
    }

    return options
  }, [productsQuery.data, productId, productDetailQuery.data])

  const productPickerLoading =
    productsQuery.isLoading ||
    (Boolean(productId) &&
      !productsQuery.data?.some((product) => product.id === productId) &&
      productDetailQuery.isLoading)

  const listingFilterOptions = useMemo((): FilterOption[] => {
    const options = listingOptions.map((listing) => ({
      value: listing.id,
      label: listing.platform_title?.trim() || listing.platform_sku || listing.id,
    }))

    if (listingId && !options.some((option) => option.value === listingId)) {
      options.unshift({
        value: listingId,
        label: editing?.scope_label
          ? listingLabelFromScopeLabel(editing.scope_label)
          : listingId,
      })
    }

    return options
  }, [listingOptions, listingId, editing])

  const handleSave = () => {
    const parsed = Number(velocityPct)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return

    const enabled = rule?.enabled ? (editing?.enabled ?? true) : false

    if (scopeType === 'channel') {
      if (!connectionId) return
      onSave({
        scope_type: 'channel',
        scope_id: null,
        platform_connection_id: connectionId,
        enabled,
        velocity_pct: parsed / 100,
      })
      return
    }

    if (scopeType === 'product') {
      if (!productId) return
      onSave({
        scope_type: 'product',
        scope_id: productId,
        platform_connection_id: null,
        enabled,
        velocity_pct: parsed / 100,
      })
      return
    }

    if (!productId || !connectionId || !listingId) return
    onSave({
      scope_type: 'product_listing',
      scope_id: listingId,
      platform_connection_id: connectionId,
      enabled,
      velocity_pct: parsed / 100,
    })
  }

  const identityLocked = Boolean(editing) || saving || deleting

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>
          {editing ? shellT(lang, 'alarmsEditRule') : shellT(lang, 'alarmsAddRule')}
        </SheetTitle>
      </SheetHeader>

      <SheetBody className="space-y-4">
        <SheetDescription>{shellT(lang, 'alarmsLowStockRuleSheetDescription')}</SheetDescription>

        <div className={cn(identityLocked && 'pointer-events-none opacity-60')}>
          <FilterComboboxSingle
            label={shellT(lang, 'alarmsColScope')}
            options={scopeOptions}
            value={scopeType}
            onValueChange={(value) => {
              if (value === 'channel' || value === 'product' || value === 'product_listing') {
                setScopeType(value)
                if (value === 'channel') {
                  setProductId('')
                  setListingId('')
                }
              }
            }}
            selectionMode="single"
            searchPlaceholder={searchPlaceholder}
            emptyLabel={shellT(lang, 'filterComingSoon')}
            allowClear={false}
            labelLayout="stacked"
            popoverSide="bottom"
          />
        </div>

        {scopeType === 'channel' ? (
          <div className={cn(identityLocked && 'pointer-events-none opacity-60')}>
            <FilterComboboxSingle
              label={shellT(lang, 'alarmsChannelLabel')}
              options={connectionOptions}
              value={connectionId}
              onValueChange={setConnectionId}
              selectionMode="single"
              searchPlaceholder={searchPlaceholder}
              emptyLabel={shellT(lang, 'alarmsChannelPlaceholder')}
              loading={connectionsQuery.isLoading}
              loadingLabel={shellT(lang, 'alarmsChannelPlaceholder')}
              allowClear={false}
              labelLayout="stacked"
              popoverSide="bottom"
            />
          </div>
        ) : (
          <>
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
                loading={productPickerLoading}
                loadingLabel={shellT(lang, 'alarmsProductPlaceholder')}
                allowClear={false}
                labelLayout="stacked"
                popoverSide="bottom"
              />
            </div>

            {scopeType === 'product_listing' ? (
              <>
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
                    labelLayout="stacked"
                    popoverSide="bottom"
                  />
                </div>
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
                    labelLayout="stacked"
                    popoverSide="bottom"
                  />
                </div>
              </>
            ) : null}
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="low-stock-rule-threshold">{shellT(lang, 'alarmsThresholdLabel')}</Label>
          <div className="flex max-w-xs items-center gap-2">
            <Input
              id="low-stock-rule-threshold"
              type="number"
              min={1}
              max={100}
              value={velocityPct}
              onChange={(event) => setVelocityPct(event.target.value)}
              disabled={saving || deleting}
            />
            <span className="text-sm text-text-secondary">%</span>
          </div>
        </div>

        {editing ? (
          <div className="border-t border-border-subtle pt-4">
            <p className="text-sm font-medium text-text-primary">
              {shellT(lang, 'alarmsDeleteRuleSectionTitle')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {shellT(lang, 'alarmsDeleteRuleSectionDescription')}
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-3"
              disabled={saving || deleting}
              onClick={() => setDeleteDialogOpen(true)}
            >
              {shellT(lang, 'alarmsDeleteRule')}
            </Button>
          </div>
        ) : null}
      </SheetBody>

      <SheetFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={saving || deleting}
        >
          {shellT(lang, 'alarmsCancel')}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || deleting}>
          {saving ? shellT(lang, 'alarmsSaving') : shellT(lang, 'alarmsSaveRule')}
        </Button>
      </SheetFooter>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{shellT(lang, 'alarmsDeleteRuleConfirmTitle')}</DialogTitle>
            <DialogDescription>{shellT(lang, 'alarmsDeleteRuleConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              {shellT(lang, 'alarmsCancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              className="gap-2"
              onClick={async () => {
                try {
                  await onDelete()
                  setDeleteDialogOpen(false)
                } catch {
                  // keep dialog open on failure
                }
              }}
            >
              {deleting ? <LoadingIcon className="size-4" /> : null}
              {shellT(lang, 'alarmsDeleteRuleConfirmAction')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function LowStockRuleSheet({
  lang,
  open,
  editing,
  rule,
  saving,
  deleting,
  onOpenChange,
  onSave,
  onDelete,
}: LowStockRuleSheetProps) {
  const formKey = editing?.id ?? 'create'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {open ? (
          <LowStockRuleSheetForm
            key={formKey}
            lang={lang}
            editing={editing}
            rule={rule}
            saving={saving}
            deleting={deleting}
            onOpenChange={onOpenChange}
            onSave={onSave}
            onDelete={onDelete}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
